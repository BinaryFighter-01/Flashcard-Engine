export interface CardProgress {
     id: string;
     ease_factor: number;
     interval: number;
     repetitions: number;
     next_review_date: Date;
     last_reviewed_at: Date;
     total_reviews: number;
     correct_reviews: number;
     last_response_quality: number;
}

/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 * Quality scores: 0 = complete blackout, 3 = hard, 4 = good, 5 = easy
 */
export function calculateNextReview(
     card: CardProgress,
     quality: number
): CardProgress {
     let { ease_factor, interval, repetitions } = card;

     // Ensure quality is in valid range
     quality = Math.max(0, Math.min(5, quality));

     if (quality >= 3) {
          // Answer was correct or acceptable
          if (repetitions === 0) {
               interval = 1;
          } else if (repetitions === 1) {
               interval = 6;
          } else {
               interval = Math.round(interval * ease_factor);
          }
          repetitions += 1;
     } else {
          // Answer was incorrect - reset
          repetitions = 0;
          interval = 1;
     }

     // Update ease_factor
     ease_factor =
          ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

     // Ensure ease_factor doesn't go below 1.3
     ease_factor = Math.max(1.3, ease_factor);

     // Calculate next review date
     const nextReviewDate = new Date();
     nextReviewDate.setDate(nextReviewDate.getDate() + interval);

     return {
          ...card,
          ease_factor,
          interval,
          repetitions,
          next_review_date: nextReviewDate,
          total_reviews: card.total_reviews + 1,
          correct_reviews: quality >= 3 ? card.correct_reviews + 1 : card.correct_reviews,
          last_reviewed_at: new Date(),
          last_response_quality: quality,
     };
}

/**
 * Calculate mastery percentage (% of cards with interval > 21 days)
 */
export function calculateMastery(cards: CardProgress[]): number {
     if (cards.length === 0) return 0;
     const mastered = cards.filter((c) => c.interval > 21).length;
     return Math.round((mastered / cards.length) * 100);
}

/**
 * Calculate study streak (consecutive days with reviews)
 */
export function calculateStreak(reviews: Date[]): number {
     if (reviews.length === 0) return 0;

     let streak = 1;
     const sortedDates = reviews.sort((a, b) => b.getTime() - a.getTime());

     for (let i = 1; i < sortedDates.length; i++) {
          const current = new Date(sortedDates[i]);
          const previous = new Date(sortedDates[i - 1]);

          const dayDiff = Math.floor(
               (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
               streak++;
          } else {
               break;
          }
     }

     return streak;
}

/**
 * Get cards due for review today
 */
export function getCardsDueToday(cards: CardProgress[]): CardProgress[] {
     const today = new Date();
     today.setHours(0, 0, 0, 0);

     return cards.filter((card) => {
          const reviewDate = new Date(card.next_review_date);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate <= today;
     });
}
