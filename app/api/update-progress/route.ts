import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { calculateNextReview, CardProgress } from '@/app/lib/spaced-repetition';

export async function POST(request: NextRequest) {
     try {
          const { cardId, quality } = await request.json();

          if (!cardId || quality === undefined) {
               return NextResponse.json(
                    { error: 'Missing cardId or quality' },
                    { status: 400 }
               );
          }

          // Validate quality score (0-5)
          if (quality < 0 || quality > 5 || !Number.isInteger(quality)) {
               return NextResponse.json(
                    { error: 'Quality must be an integer between 0 and 5' },
                    { status: 400 }
               );
          }

          const supabase = createClient();

          // Get current user
          const {
               data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
               return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
               );
          }

          // Get current card progress
          const { data: currentProgress, error: fetchError } = await supabase
               .from('card_progress')
               .select('*')
               .eq('card_id', cardId)
               .eq('user_id', user.id)
               .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
               throw fetchError;
          }

          // If no progress exists, create initial entry
          if (!currentProgress) {
               const initialProgress = {
                    id: crypto.randomUUID(),
                    card_id: cardId,
                    user_id: user.id,
                    ease_factor: 2.5,
                    interval: 1,
                    repetitions: 0,
                    next_review_date: new Date().toISOString(),
                    last_reviewed_at: new Date().toISOString(),
                    total_reviews: 0,
                    correct_reviews: 0,
                    last_response_quality: quality,
               };

               const updated = calculateNextReview(initialProgress as CardProgress, quality);

               const { error: insertError } = await supabase
                    .from('card_progress')
                    .insert(updated);

               if (insertError) throw insertError;

               return NextResponse.json({
                    nextReviewDate: updated.next_review_date,
                    interval: updated.interval,
                    easeFactor: updated.ease_factor,
               });
          }

          // Calculate next review using SM-2 algorithm
          const updated = calculateNextReview(currentProgress as CardProgress, quality);

          // Update in database
          const { error: updateError } = await supabase
               .from('card_progress')
               .update({
                    ease_factor: updated.ease_factor,
                    interval: updated.interval,
                    repetitions: updated.repetitions,
                    next_review_date: updated.next_review_date,
                    last_reviewed_at: updated.last_reviewed_at,
                    total_reviews: updated.total_reviews,
                    correct_reviews: updated.correct_reviews,
                    last_response_quality: updated.last_response_quality,
               })
               .eq('id', currentProgress.id);

          if (updateError) throw updateError;

          return NextResponse.json({
               nextReviewDate: updated.next_review_date,
               interval: updated.interval,
               easeFactor: updated.ease_factor,
               mastered: updated.interval > 21,
          });
     } catch (error: any) {
          console.error('Error in update-progress:', error);
          return NextResponse.json(
               { error: error.message || 'Internal server error' },
               { status: 500 }
          );
     }
}
