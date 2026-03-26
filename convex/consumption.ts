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
    tastingNotes: v.optional(v.string()),
    loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest"))),
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

    if (args.tastingNotes !== undefined && args.tastingNotes.length > 280) {
      throw new ConvexError("TASTING_NOTES_TOO_LONG");
    }

    // Atomically create log and decrement brews
    const logId = await ctx.db.insert("consumptionLogs", {
      userId: identity.subject,
      productId: args.productId,
      batchId: args.batchId,
      date: args.date,
      rating: args.rating,
      tastingNotes: args.tastingNotes,
      loggedFor: args.loggedFor ?? "self",
    });

    await ctx.db.patch(args.batchId, {
      brewsRemaining: batch.brewsRemaining - 1,
    });

    return logId;
  },
});

export const listRecentForGuest = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .filter((q) => q.eq(q.field("loggedFor"), "guest"))
      .take(args.limit);

    return logs.map((log) => log.productId as string);
  },
});

export const ratingsForProducts = query({
  args: {
    forGuest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    const filtered = args.forGuest
      ? logs.filter((l) => l.loggedFor === "guest" && l.rating !== undefined)
      : logs.filter((l) => l.loggedFor !== "guest" && l.rating !== undefined);

    // Group by productId, take last 5 ratings per product
    const byProduct: Record<string, number[]> = {};
    for (const log of filtered) {
      const pid = log.productId as string;
      if (!byProduct[pid]) byProduct[pid] = [];
      if (byProduct[pid].length < 5) {
        byProduct[pid].push(log.rating as number);
      }
    }

    // Compute average of last 5 ratings per product
    const result: Record<string, number> = {};
    for (const [pid, ratings] of Object.entries(byProduct)) {
      result[pid] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    }

    return result;
  },
});

export const averageRatings = query({
  args: {
    forGuest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const logs = await ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const filtered = args.forGuest
      ? logs.filter((l) => l.loggedFor === "guest" && l.rating !== undefined)
      : logs.filter((l) => l.loggedFor !== "guest" && l.rating !== undefined);

    // Group all ratings by productId
    const byProduct: Record<string, number[]> = {};
    for (const log of filtered) {
      const pid = log.productId as string;
      if (!byProduct[pid]) byProduct[pid] = [];
      byProduct[pid].push(log.rating as number);
    }

    // Compute average and count per product
    const result: Record<string, { average: number; count: number }> = {};
    for (const [pid, ratings] of Object.entries(byProduct)) {
      result[pid] = {
        average: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
        count: ratings.length,
      };
    }

    return result;
  },
});

export const rate = mutation({
  args: {
    id: v.id("consumptionLogs"),
    rating: v.optional(v.number()),
    tastingNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const log = await ctx.db.get(args.id);
    if (!log || log.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new ConvexError("INVALID_RATING");
    }

    if (args.tastingNotes !== undefined && args.tastingNotes.length > 280) {
      throw new ConvexError("TASTING_NOTES_TOO_LONG");
    }

    const patch: { rating?: number; tastingNotes?: string } = {};
    if (args.rating !== undefined) {
      patch.rating = args.rating;
    }
    if (args.tastingNotes !== undefined) {
      patch.tastingNotes = args.tastingNotes;
    }

    await ctx.db.patch(args.id, patch);
  },
});
