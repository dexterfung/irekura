import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 1-indexed
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const startDate = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
    const endMonth = args.month === 12 ? 1 : args.month + 1;
    const endYear = args.month === 12 ? args.year + 1 : args.year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user_date", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).eq("userId", identity.subject).gte("date", startDate)
      )
      .filter((q) => q.lt(q.field("date"), endDate))
      .collect();

    const results = await Promise.all(
      logs.map(async (log) => {
        const product = await ctx.db.get(log.productId);
        if (!product) return null;
        const batch = await ctx.db.get(log.batchId);
        return { log, product, batch };
      })
    );

    return results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );
  },
});

export const listRecent = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit);

    return logs.map((log) => log.productId as string);
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    batchId: v.id("batches"),
    date: v.string(),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const product = await ctx.db.get(args.productId);
    if (!product || product.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    if (batch.brewsRemaining <= 0) {
      throw new ConvexError("BATCH_DEPLETED");
    }

    const today = new Date().toISOString().slice(0, 10);
    if (args.date > today) {
      throw new ConvexError("FUTURE_DATE");
    }

    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new ConvexError("INVALID_RATING");
    }

    // Atomically create log and decrement brews
    const logId = await ctx.db.insert("consumptionLogs", {
      userId: identity.subject,
      productId: args.productId,
      batchId: args.batchId,
      date: args.date,
      rating: args.rating,
    });

    await ctx.db.patch(args.batchId, {
      brewsRemaining: batch.brewsRemaining - 1,
    });

    return logId;
  },
});

export const rate = mutation({
  args: {
    id: v.id("consumptionLogs"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const log = await ctx.db.get(args.id);
    if (!log || log.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError("INVALID_RATING");
    }

    await ctx.db.patch(args.id, { rating: args.rating });
  },
});
