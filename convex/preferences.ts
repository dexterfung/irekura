import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function resolveGuestId(
  ctx: { auth: { getUserIdentity(): Promise<{ subject: string } | null> }; db: { query(table: string): { withIndex(name: string, cb: (q: unknown) => unknown): { unique(): Promise<{ guestId?: string } | null> } } } }
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthenticated");
  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("userId", identity.subject)
    )
    .unique();
  if (!settings?.guestId) throw new ConvexError("GUEST_NOT_CONFIGURED");
  return settings.guestId;
}

export const get = query({
  args: {
    type: v.union(v.literal("weekday"), v.literal("weekend")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const profile = await ctx.db
      .query("preferenceProfiles")
      .withIndex("by_user_type", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).eq("userId", identity.subject).eq("type", args.type)
      )
      .first();

    return profile ?? null;
  },
});

export const getForGuest = query({
  args: {
    type: v.union(v.literal("weekday"), v.literal("weekend")),
  },
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guestId = await resolveGuestId(ctx as any);

    const profile = await ctx.db
      .query("preferenceProfiles")
      .withIndex("by_user_type", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).eq("userId", guestId).eq("type", args.type)
      )
      .first();

    return profile ?? null;
  },
});

export const upsertForGuest = mutation({
  args: {
    type: v.union(v.literal("weekday"), v.literal("weekend")),
    bitterness: v.number(),
    sourness: v.number(),
    richness: v.number(),
  },
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guestId = await resolveGuestId(ctx as any);

    if (
      args.bitterness < 1 || args.bitterness > 5 ||
      args.sourness < 1 || args.sourness > 5 ||
      args.richness < 1 || args.richness > 5
    ) {
      throw new ConvexError("INVALID_WEIGHT");
    }

    const existing = await ctx.db
      .query("preferenceProfiles")
      .withIndex("by_user_type", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).eq("userId", guestId).eq("type", args.type)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bitterness: args.bitterness,
        sourness: args.sourness,
        richness: args.richness,
      });
    } else {
      await ctx.db.insert("preferenceProfiles", {
        userId: guestId,
        type: args.type,
        bitterness: args.bitterness,
        sourness: args.sourness,
        richness: args.richness,
      });
    }
  },
});

export const upsert = mutation({
  args: {
    type: v.union(v.literal("weekday"), v.literal("weekend")),
    bitterness: v.number(),
    sourness: v.number(),
    richness: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    if (
      args.bitterness < 1 || args.bitterness > 5 ||
      args.sourness < 1 || args.sourness > 5 ||
      args.richness < 1 || args.richness > 5
    ) {
      throw new ConvexError("INVALID_WEIGHT");
    }

    const existing = await ctx.db
      .query("preferenceProfiles")
      .withIndex("by_user_type", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).eq("userId", identity.subject).eq("type", args.type)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bitterness: args.bitterness,
        sourness: args.sourness,
        richness: args.richness,
      });
    } else {
      await ctx.db.insert("preferenceProfiles", {
        userId: identity.subject,
        type: args.type,
        bitterness: args.bitterness,
        sourness: args.sourness,
        richness: args.richness,
      });
    }
  },
});
