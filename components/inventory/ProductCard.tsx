import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDaysUntilExpiry, toISODateString } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

interface ProductCardProps {
  product: Doc<"products">;
  batches: Doc<"batches">[];
  onClick?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  "drip-bag": "Drip Bag",
  "ground-bean": "Ground Bean",
  "concentrate-capsule": "Capsule",
  "instant-powder": "Instant",
};

export default function ProductCard({ product, batches, onClick }: ProductCardProps) {
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
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">{product.name}</div>
            <div className="text-sm text-muted-foreground truncate">{product.brand}</div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {TYPE_LABELS[product.type] ?? product.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{totalBrews}</span>
            <span className="text-muted-foreground ml-1">brews remaining</span>
          </div>
          <div className="flex gap-1">
            {hasExpired && <Badge variant="expired">Expired</Badge>}
            {!hasExpired && hasExpiringSoon && (
              <Badge variant="warning">Expiring soon</Badge>
            )}
          </div>
        </div>
        {earliestExpiry && (
          <div className="text-xs text-muted-foreground mt-1">
            Best before: {earliestExpiry}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
