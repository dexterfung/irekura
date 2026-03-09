import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTheme = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    return settings?.theme ?? "system";
  },
});

export const setTheme = mutation({
  args: {
    theme: v.union(v.literal("system"), v.literal("light"), v.literal("dark")),
  },
  handler: async (ctx, { theme }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { theme });
    } else {
      await ctx.db.insert("userSettings", { userId: identity.subject, theme });
    }
  },
});
