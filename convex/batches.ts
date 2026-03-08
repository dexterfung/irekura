import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const product = await ctx.db.get(args.productId);
    if (!product || product.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    return await ctx.db
      .query("batches")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("asc")
      .collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gt(q.field("brewsRemaining"), 0))
      .collect();

    const results = await Promise.all(
      batches.map(async (batch) => {
        const product = await ctx.db.get(batch.productId);
        if (!product) return null;
        return { batch, product };
      })
    );

    return results.filter(
      (r): r is { batch: (typeof batches)[0]; product: Doc<"products"> } =>
        r !== null
    );
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    brewsRemaining: v.number(),
    bestBeforeDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const product = await ctx.db.get(args.productId);
    if (!product || product.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    if (args.brewsRemaining < 1) {
      throw new ConvexError("INVALID_QUANTITY");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.bestBeforeDate)) {
      throw new ConvexError("INVALID_DATE");
    }

    return await ctx.db.insert("batches", {
      userId: identity.subject,
      productId: args.productId,
      brewsRemaining: args.brewsRemaining,
      bestBeforeDate: args.bestBeforeDate,
    });
  },
});

export const updateQuantity = mutation({
  args: {
    id: v.id("batches"),
    brewsRemaining: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const batch = await ctx.db.get(args.id);
    if (!batch || batch.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    if (args.brewsRemaining < 0) {
      throw new ConvexError("INVALID_QUANTITY");
    }

    await ctx.db.patch(args.id, { brewsRemaining: args.brewsRemaining });
  },
});

export const remove = mutation({
  args: { id: v.id("batches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const batch = await ctx.db.get(args.id);
    if (!batch || batch.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    // Delete all consumption logs for this batch
    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("batchId"), args.id))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.id);
  },
});
