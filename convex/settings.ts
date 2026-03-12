import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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

export const getGuestSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    return {
      guestEnabled: settings?.guestEnabled ?? false,
      guestId: settings?.guestId ?? null,
      guestDisplayName: settings?.guestDisplayName ?? null,
    };
  },
});

export const setGuestEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    // Generate a stable guestId on first enable; never overwrite an existing one
    const guestId = existing?.guestId ?? `guest:${identity.subject}`;

    if (existing) {
      await ctx.db.patch(existing._id, { guestEnabled: enabled, guestId });
    } else {
      await ctx.db.insert("userSettings", {
        userId: identity.subject,
        theme: "system",
        guestEnabled: enabled,
        guestId,
      });
    }
  },
});

export const setGuestDisplayName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      throw new ConvexError("INVALID_NAME");
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { guestDisplayName: trimmed });
    } else {
      await ctx.db.insert("userSettings", {
        userId: identity.subject,
        theme: "system",
        guestDisplayName: trimmed,
      });
    }
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
