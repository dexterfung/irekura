import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    return await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    type: v.union(
      v.literal("drip-bag"),
      v.literal("ground-bean"),
      v.literal("concentrate-capsule"),
      v.literal("instant-powder")
    ),
    bitterness: v.number(),
    sourness: v.number(),
    richness: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    if (
      args.bitterness < 1 || args.bitterness > 5 ||
      args.sourness < 1 || args.sourness > 5 ||
      args.richness < 1 || args.richness > 5
    ) {
      throw new ConvexError("INVALID_FLAVOR_RATING");
    }

    return await ctx.db.insert("products", {
      userId: identity.subject,
      name: args.name,
      brand: args.brand,
      type: args.type,
      bitterness: args.bitterness,
      sourness: args.sourness,
      richness: args.richness,
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    brand: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("drip-bag"),
        v.literal("ground-bean"),
        v.literal("concentrate-capsule"),
        v.literal("instant-powder")
      )
    ),
    bitterness: v.optional(v.number()),
    sourness: v.optional(v.number()),
    richness: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const product = await ctx.db.get(args.id);
    if (!product || product.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const product = await ctx.db.get(args.id);
    if (!product || product.userId !== identity.subject) {
      throw new ConvexError("NOT_FOUND");
    }

    // Cascade delete batches and their consumption logs
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();

    for (const batch of batches) {
      // Delete consumption logs for this batch
      const logs = await ctx.db
        .query("consumptionLogs")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .filter((q) => q.eq(q.field("batchId"), batch._id))
        .collect();
      for (const log of logs) {
        await ctx.db.delete(log._id);
      }
      await ctx.db.delete(batch._id);
    }

    await ctx.db.delete(args.id);
  },
});
