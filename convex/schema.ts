import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    userId: v.string(),
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
  }).index("by_user", ["userId"]),

  batches: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    brewsRemaining: v.number(),
    bestBeforeDate: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_user_expiry", ["userId", "bestBeforeDate"]),

  consumptionLogs: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    batchId: v.id("batches"),
    date: v.string(),
    rating: v.optional(v.number()),
    tastingNotes: v.optional(v.string()),
    loggedFor: v.optional(v.union(v.literal("self"), v.literal("guest"))),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  preferenceProfiles: defineTable({
    userId: v.string(),
    type: v.union(v.literal("weekday"), v.literal("weekend")),
    bitterness: v.number(),
    sourness: v.number(),
    richness: v.number(),
  }).index("by_user_type", ["userId", "type"]),

  userSettings: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("system"), v.literal("light"), v.literal("dark")),
    guestEnabled: v.optional(v.boolean()),
    guestId: v.optional(v.string()),
    guestDisplayName: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
