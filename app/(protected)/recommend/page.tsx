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
import { useTranslations } from "next-intl";

function RatingStars({ onRate }: { onRate: (rating: number) => void }) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const tStar = useTranslations("starRating");
  return (
    <div className="flex justify-center gap-1 py-4" onMouseLeave={() => setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHoverValue(star)}
          className="text-4xl cursor-pointer transition-colors min-w-[44px] min-h-[44px]"
          style={{ color: star <= (hoverValue ?? 0) ? "#facc15" : "var(--color-muted-foreground, #9ca3af)" }}
          aria-label={tStar("star", { count: star })}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RecommendPage() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [pendingLogId, setPendingLogId] = useState<Id<"consumptionLogs"> | null>(null);
  const [viewingAs, setViewingAs] = useState<"self" | "guest">("self");
  const t = useTranslations("recommend");
  const tGuest = useTranslations("guestProfile");

  const dayType = getDayType(toISODateString(new Date()));

  const guestSettings = useQuery(api.settings.getGuestSettings);
  const activeBatches = useQuery(api.batches.listActive);
  const selfRecentProductIds = useQuery(api.consumption.listRecent, { limit: 10 });
  const guestRecentProductIds = useQuery(
    api.consumption.listRecentForGuest,
    viewingAs === "guest" ? { limit: 10 } : "skip"
  );
  const selfProfile = useQuery(api.preferences.get, { type: dayType });
  const guestProfile = useQuery(
    api.preferences.getForGuest,
    viewingAs === "guest" ? { type: dayType } : "skip"
  );
  const createLog = useMutation(api.consumption.create);
  const rateLog = useMutation(api.consumption.rate);

  const guestEnabled = guestSettings?.guestEnabled ?? false;
  const guestDisplayName = guestSettings?.guestDisplayName ?? tGuest("defaultName");

  const isLoading =
    activeBatches === undefined ||
    selfRecentProductIds === undefined ||
    selfProfile === undefined ||
    guestSettings === undefined;

  const activeProfile = (viewingAs === "guest" ? guestProfile : selfProfile) ?? getDefaultProfile();
  const activeRecentIds = (viewingAs === "guest" ? guestRecentProductIds : selfRecentProductIds) ?? [];
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
    ? scoreAndRankBatches(batches, activeProfile, selectedMood, today, activeRecentIds)
    : [];

  const recommendation = ranked[currentIndex] ?? null;

  async function handleDrink() {
    if (!recommendation) return;
    try {
      const logId = await createLog({
        productId: recommendation.productId as Id<"products">,
        batchId: recommendation.batchId as Id<"batches">,
        date: today,
        loggedFor: viewingAs,
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
        <h2 className="text-lg font-semibold mb-1">{t("noInventoryTitle")}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {t("noInventoryDescription")}
        </p>
        <Button asChild>
          <Link href="/inventory/new">{t("addCoffee")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Person switcher — only when guest is enabled */}
        {guestEnabled && (
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["self", "guest"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setViewingAs(option);
                  setSelectedMood(null);
                  setCurrentIndex(0);
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                  viewingAs === option
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-accent"
                }`}
              >
                {option === "self" ? tGuest("you") : guestDisplayName}
              </button>
            ))}
          </div>
        )}

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
              {t("recommendedForYou")}
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
            <p>{t("noRecommendations")}</p>
          </div>
        )}
      </div>


      {/* Rating dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ratingPrompt")}</DialogTitle>
          </DialogHeader>
          <RatingStars onRate={handleRate} />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRatingDialogOpen(false);
                setPendingLogId(null);
              }}
            >
              {t("skip")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
