import { differenceInDays, parseISO, getDay } from "date-fns";

export type CoffeeType =
  | "drip-bag"
  | "ground-bean"
  | "concentrate-capsule"
  | "instant-powder";

export type Mood =
  | "light-bright"
  | "strong-rich"
  | "smooth-balanced"
  | "surprise-me";

export type DayType = "weekday" | "weekend";

export interface FlavorProfile {
  bitterness: number; // 1–5
  sourness: number; // 1–5
  richness: number; // 1–5
}

export interface BatchInput {
  batchId: string;
  productId: string;
  bestBeforeDate: string; // "YYYY-MM-DD"
  brewsRemaining: number;
  product: {
    name: string;
    brand: string;
    type: CoffeeType;
  } & FlavorProfile;
}

export interface ScoredBatch extends BatchInput {
  score: number;
  expiryUrgency: "expired" | "urgent" | "warning" | "ok";
}

export function computeExpiryScore(
  bestBeforeDate: string,
  todayISO: string
): { score: number; urgency: "expired" | "urgent" | "warning" | "ok" } {
  const days = differenceInDays(parseISO(bestBeforeDate), parseISO(todayISO));

  if (days < 0) return { score: 200, urgency: "expired" };
  if (days <= 7) return { score: 100, urgency: "urgent" };
  if (days <= 30) return { score: 20, urgency: "warning" };
  return { score: 0, urgency: "ok" };
}

export function computeRatingMultiplier(
  averageRating: number | undefined
): number {
  if (averageRating === undefined) return 1.0;
  if (averageRating >= 4) return 1.2;
  if (averageRating <= 2) return 0.8;
  return 1.0;
}

export function computeFlavorScore(
  product: FlavorProfile & { bitterness: number; sourness: number; richness: number },
  profile: FlavorProfile,
  mood: Mood,
  productId?: string,
  recentProductIds?: string[],
  ratingMultiplier?: number
): number {
  let score: number;

  switch (mood) {
    case "light-bright":
      score =
        product.sourness * profile.sourness +
        (6 - product.bitterness) * profile.bitterness;
      break;

    case "strong-rich":
      score =
        product.bitterness * profile.bitterness +
        product.richness * profile.richness;
      break;

    case "smooth-balanced": {
      const deviation =
        Math.abs(product.bitterness - 3) +
        Math.abs(product.sourness - 3) +
        Math.abs(product.richness - 3);
      const avgWeight = (profile.bitterness + profile.sourness + profile.richness) / 3;
      score = (15 - deviation) * avgWeight;
      break;
    }

    case "surprise-me": {
      const recent = recentProductIds ?? [];
      const idx = productId ? recent.indexOf(productId) : -1;
      const recencyPenalty = idx === -1 ? 0 : (recent.length - idx) * 10;
      score = 50 - recencyPenalty;
      break;
    }
  }

  score = Math.max(0, score);

  // Apply rating multiplier only for flavour-based moods (not surprise-me)
  if (mood !== "surprise-me") {
    score *= ratingMultiplier ?? 1.0;
  }

  return score;
}

export function scoreAndRankBatches(
  batches: BatchInput[],
  profile: FlavorProfile,
  mood: Mood,
  todayISO: string,
  recentProductIds: string[],
  productRatings?: Record<string, number>
): ScoredBatch[] {
  const eligible = batches.filter((b) => b.brewsRemaining > 0);

  const scored: ScoredBatch[] = eligible.map((batch) => {
    const { score: expiryScore, urgency: expiryUrgency } = computeExpiryScore(
      batch.bestBeforeDate,
      todayISO
    );
    const ratingMultiplier = productRatings
      ? computeRatingMultiplier(productRatings[batch.productId])
      : undefined;
    const flavorScore = computeFlavorScore(
      batch.product,
      profile,
      mood,
      batch.productId,
      recentProductIds,
      ratingMultiplier
    );
    return {
      ...batch,
      score: expiryScore + flavorScore,
      expiryUrgency,
    };
  });

  // Stable sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

export function getDefaultProfile(): FlavorProfile {
  return { bitterness: 3, sourness: 3, richness: 3 };
}

export function getDayType(dateISO: string): DayType {
  const day = getDay(parseISO(dateISO));
  return day === 0 || day === 6 ? "weekend" : "weekday";
}
