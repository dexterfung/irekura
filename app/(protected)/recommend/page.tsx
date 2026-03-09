"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import MoodSelector from "@/components/recommendation/MoodSelector";
import RecommendationCard from "@/components/recommendation/RecommendationCard";
import {
  scoreAndRankBatches,
  getDefaultProfile,
  getDayType,
  type Mood,
  type BatchInput,
} from "@/lib/recommendations/engine";
import { toISODateString } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RecommendPage() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [pendingLogId, setPendingLogId] = useState<Id<"consumptionLogs"> | null>(null);

  const activeBatches = useQuery(api.batches.listActive);
  const recentProductIds = useQuery(api.consumption.listRecent, { limit: 10 });
  const weekdayProfile = useQuery(api.preferences.get, { type: getDayType(toISODateString(new Date())) });
  const createLog = useMutation(api.consumption.create);
  const rateLog = useMutation(api.consumption.rate);

  const isLoading =
    activeBatches === undefined || recentProductIds === undefined || weekdayProfile === undefined;

  const profile = weekdayProfile ?? getDefaultProfile();
  const today = toISODateString(new Date());

  const batches: BatchInput[] = isLoading
    ? []
    : (activeBatches as Array<{ batch: import("@/convex/_generated/dataModel").Doc<"batches">; product: import("@/convex/_generated/dataModel").Doc<"products"> }>).map(({ batch, product }) => ({
        batchId: batch._id as string,
        productId: product._id as string,
        bestBeforeDate: batch.bestBeforeDate,
        brewsRemaining: batch.brewsRemaining,
        product: {
          name: product.name,
          brand: product.brand,
          type: product.type,
          bitterness: product.bitterness,
          sourness: product.sourness,
          richness: product.richness,
        },
      }));

  const ranked = selectedMood
    ? scoreAndRankBatches(batches, profile, selectedMood, today, recentProductIds ?? [])
    : [];

  const recommendation = ranked[currentIndex] ?? null;

  async function handleDrink() {
    if (!recommendation) return;
    try {
      const logId = await createLog({
        productId: recommendation.productId as Id<"products">,
        batchId: recommendation.batchId as Id<"batches">,
        date: today,
      });
      setPendingLogId(logId);
      setRatingDialogOpen(true);
      setCurrentIndex(0);
      setSelectedMood(null);
    } catch (err) {
      console.error("Failed to log consumption:", err);
    }
  }

  async function handleRate(rating: number) {
    if (!pendingLogId) return;
    await rateLog({ id: pendingLogId, rating });
    setRatingDialogOpen(false);
    setPendingLogId(null);
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl mb-4">☕</div>
        <h2 className="text-lg font-semibold mb-1">No coffee in inventory</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add some coffee to get recommendations
        </p>
        <Button asChild>
          <Link href="/inventory/new">Add Coffee</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
<div className="p-4 max-w-lg mx-auto space-y-6">
        <MoodSelector
          selected={selectedMood}
          onSelect={(mood) => {
            setSelectedMood(mood);
            setCurrentIndex(0);
          }}
        />

        {selectedMood && recommendation && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Recommended for you
            </h2>
            <RecommendationCard
              recommendation={recommendation}
              onDrink={handleDrink}
              onShowAnother={() => setCurrentIndex((i) => i + 1)}
              hasMore={currentIndex < ranked.length - 1}
            />
          </div>
        )}

        {selectedMood && ranked.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recommendations available for this mood.</p>
          </div>
        )}
      </div>

      {/* Rating dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How was it? (optional)</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                className="text-4xl text-muted-foreground hover:text-yellow-400 transition-colors min-w-[44px] min-h-[44px]"
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRatingDialogOpen(false);
                setPendingLogId(null);
              }}
            >
              Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
