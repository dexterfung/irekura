import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const allConsumptionLogs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    return ctx.db
      .query("consumptionLogs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const allBatches = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    return ctx.db
      .query("batches")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
