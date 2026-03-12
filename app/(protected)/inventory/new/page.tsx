"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductForm from "@/components/inventory/ProductForm";
import BatchForm from "@/components/inventory/BatchForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const APPROXIMATE_TYPES = ["ground-bean", "instant-powder"];

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useMutation(api.products.create);
  const createBatch = useMutation(api.batches.create);
  const [step, setStep] = useState<"product" | "batch">("product");
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<Parameters<typeof createProduct>[0] | null>(
    null
  );
  const t = useTranslations("newProduct");

  async function handleProductSubmit(values: Parameters<typeof createProduct>[0]) {
    setProductData(values);
    setStep("batch");
  }

  async function handleBatchSubmit(values: {
    brewsRemaining: number;
    bestBeforeDate: string;
  }) {
    if (!productData) return;
    setIsLoading(true);
    try {
      const newProductId = await createProduct(productData);
      await createBatch({
        productId: newProductId,
        brewsRemaining: values.brewsRemaining,
        bestBeforeDate: values.bestBeforeDate,
      });
      router.push(`/inventory/${newProductId}`);
    } catch (err) {
      console.error("Failed to create product/batch:", err);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b bg-background px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (step === "batch" ? setStep("product") : router.back())}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {step === "product" ? t("title") : t("addFirstBatch")}
        </h1>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {step === "product" ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t("step1Description")}
            </p>
            <ProductForm
              defaultValues={productData ?? undefined}
              onSubmit={handleProductSubmit}
              submitLabel={t("nextStep")}
            />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t("step2Description")}
            </p>
            <BatchForm
              onSubmit={handleBatchSubmit}
              submitLabel={t("addToInventory")}
              isLoading={isLoading}
              isApproximate={APPROXIMATE_TYPES.includes(productData?.type ?? "")}
            />
          </>
        )}
      </div>
    </div>
  );
}
