"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDaysUntilExpiry, toISODateString } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

interface ProductCardProps {
  product: Doc<"products">;
  batches: Doc<"batches">[];
  href: string;
  averageRating?: { average: number; count: number };
}

export default function ProductCard({ product, batches, href, averageRating }: ProductCardProps) {
  const t = useTranslations("inventory");
  const tTypes = useTranslations("productTypes");
  const tRating = useTranslations("averageRating");

  const today = toISODateString(new Date());
  const activeBatches = batches.filter((b) => b.brewsRemaining > 0);
  const totalBrews = activeBatches.reduce((sum, b) => sum + b.brewsRemaining, 0);

  const earliestExpiry =
    activeBatches.length > 0
      ? activeBatches.reduce((min, b) =>
          b.bestBeforeDate < min.bestBeforeDate ? b : min
        ).bestBeforeDate
      : null;

  const hasExpiringSoon = activeBatches.some(
    (b) => getDaysUntilExpiry(b.bestBeforeDate, today) <= 30
  );

  const hasExpired = activeBatches.some(
    (b) => getDaysUntilExpiry(b.bestBeforeDate, today) < 0
  );

  const isApproximate = product.type === "ground-bean" || product.type === "instant-powder";

  return (
    <Link href={href} className="block">
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">{product.name}</div>
            <div className="text-sm text-muted-foreground truncate">{product.brand}</div>
          </div>
          <Badge variant="secondary">
            {tTypes(product.type as "drip-bag" | "ground-bean" | "concentrate-capsule" | "instant-powder")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {isApproximate ? t("estimatedServings", { count: totalBrews }) : t("brewsRemaining", { count: totalBrews })}
          </div>
          <div className="flex gap-1">
            {hasExpired && <Badge variant="expired">{t("expired")}</Badge>}
            {!hasExpired && hasExpiringSoon && (
              <Badge variant="warning">{t("expiringSoon")}</Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {earliestExpiry ? t("earliestBestBefore", { date: earliestExpiry }) : t("depleted")}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          {averageRating ? (
            <>
              <span style={{ color: "#facc15" }}>★</span>
              <span>{tRating("outOf", { rating: averageRating.average.toFixed(1) })}</span>
            </>
          ) : (
            <>
              <span>★</span>
              <span>{tRating("noRatings")}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
