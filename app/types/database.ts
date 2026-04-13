export type CardType = 'concept' | 'definition' | 'example' | 'relationship';

export interface Card {
     id: string;
     deck_id: string;
     front: string;
     back: string;
     hint: string;
     card_type: CardType;
     difficulty_level: number; // 1-5
     tags: string[];
     created_at: string;
}

export interface CardProgress {
     id: string;
     card_id: string;
     user_id: string;
     ease_factor: number;
     interval: number;
     repetitions: number;
     next_review_date: string;
     last_reviewed_at: string;
     total_reviews: number;
     correct_reviews: number;
     last_response_quality: number;
}

export interface Deck {
     id: string;
     user_id: string;
     title: string;
     description: string;
     source_filename: string;
     card_count: number;
     created_at: string;
     last_studied_at: string | null;
     color_tag: string;
}

export interface User {
     id: string;
     email: string;
     created_at: string;
     last_sign_in_at: string | null;
}
