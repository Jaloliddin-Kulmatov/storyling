import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from "ts-fsrs";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const GRADE: Record<ReviewGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Flashcard scheduling uses FSRS (open-source spaced-repetition algorithm). */
const scheduler = fsrs(generatorParameters({ enable_fuzz: false }));

export type ReviewCard = Card;

export function newCard(now: Date = new Date()): ReviewCard {
  return createEmptyCard(now);
}

export function review(card: ReviewCard, grade: ReviewGrade, now: Date = new Date()): ReviewCard {
  return scheduler.next(card, now, GRADE[grade]).card;
}

export function isDue(card: ReviewCard, now: Date = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}

/** When the next review would be for each grade, for the buttons ("Good · 4 days"). */
export function previewIntervals(card: ReviewCard, now: Date = new Date()): Record<ReviewGrade, number> {
  const out = {} as Record<ReviewGrade, number>;
  for (const g of Object.keys(GRADE) as ReviewGrade[]) {
    out[g] = scheduler.next(card, now, GRADE[g]).card.due.getTime() - now.getTime();
  }
  return out;
}
