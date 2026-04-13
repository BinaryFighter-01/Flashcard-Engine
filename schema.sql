-- ============================================
-- RecallAI Database Schema (Supabase)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: decks
-- ============================================
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_filename TEXT,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_studied_at TIMESTAMP WITH TIME ZONE,
  color_tag TEXT DEFAULT 'blue', -- for deck color coding: blue, red, green, purple, orange, etc.
  CONSTRAINT decks_title_not_empty CHECK (length(trim(title)) > 0)
);

-- ============================================
-- Table: cards
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  card_type TEXT DEFAULT 'concept' CHECK (card_type IN ('concept', 'definition', 'example', 'relationship')),
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT cards_front_not_empty CHECK (length(trim(front)) > 0),
  CONSTRAINT cards_back_not_empty CHECK (length(trim(back)) > 0)
);

-- ============================================
-- Table: card_progress
-- ============================================
CREATE TABLE IF NOT EXISTS card_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval INTEGER DEFAULT 1 CHECK (interval >= 1),
  repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  correct_reviews INTEGER DEFAULT 0 CHECK (correct_reviews >= 0),
  last_response_quality INTEGER CHECK (last_response_quality >= 0 AND last_response_quality <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Deck queries
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_created_at ON decks(created_at DESC);

-- Card queries
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_tags ON cards USING GIN(tags);

-- Progress tracking (most critical)
CREATE INDEX IF NOT EXISTS idx_card_progress_user_id ON card_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_card_progress_card_id ON card_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_card_progress_next_review ON card_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_card_progress_user_next_review ON card_progress(user_id, next_review_date);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;

-- Deck policies
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- Card policies
CREATE POLICY "Users can view cards in their decks"
  ON cards FOR SELECT
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

CREATE POLICY "Users can create cards in their decks"
  ON cards FOR INSERT
  WITH CHECK (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

CREATE POLICY "Users can update cards in their decks"
  ON cards FOR UPDATE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete cards in their decks"
  ON cards FOR DELETE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

-- Card progress policies
CREATE POLICY "Users can view their own card progress"
  ON card_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create card progress"
  ON card_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card progress"
  ON card_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Function to update deck card_count on card insert/delete
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for card count updates
CREATE TRIGGER trigger_update_deck_card_count
AFTER INSERT OR DELETE ON cards
FOR EACH ROW
EXECUTE FUNCTION update_deck_card_count();

-- Function to get cards due today for a user
CREATE OR REPLACE FUNCTION get_cards_due_today(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  deck_id UUID,
  front TEXT,
  back TEXT,
  hint TEXT,
  card_type TEXT,
  difficulty_level INTEGER,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.deck_id, c.front, c.back, c.hint, c.card_type, c.difficulty_level, c.tags
  FROM cards c
  JOIN card_progress cp ON c.id = cp.card_id
  WHERE cp.user_id = user_uuid
    AND cp.next_review_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_decks BIGINT,
  total_cards BIGINT,
  cards_due_today BIGINT,
  total_reviews BIGINT,
  correct_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.id)::BIGINT as total_decks,
    COUNT(DISTINCT c.id)::BIGINT as total_cards,
    COUNT(DISTINCT CASE WHEN cp.next_review_date <= CURRENT_DATE THEN c.id END)::BIGINT as cards_due_today,
    COALESCE(SUM(cp.total_reviews), 0)::BIGINT as total_reviews,
    COALESCE(SUM(cp.correct_reviews), 0)::BIGINT as correct_reviews
  FROM decks d
  LEFT JOIN cards c ON d.id = c.deck_id
  LEFT JOIN card_progress cp ON c.id = cp.card_id AND cp.user_id = user_uuid
  WHERE d.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
