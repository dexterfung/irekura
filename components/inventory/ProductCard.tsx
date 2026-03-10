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
}

export default function ProductCard({ product, batches, href }: ProductCardProps) {
  const t = useTranslations("inventory");
  const tTypes = useTranslations("productTypes");

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
            {t("brewsRemaining", { count: totalBrews })}
          </div>
          <div className="flex gap-1">
            {hasExpired && <Badge variant="expired">{t("expired")}</Badge>}
            {!hasExpired && hasExpiringSoon && (
              <Badge variant="warning">{t("expiringSoon")}</Badge>
            )}
          </div>
        </div>
        {earliestExpiry && (
          <div className="text-xs text-muted-foreground mt-1">
            {t("earliestBestBefore", { date: earliestExpiry })}
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
