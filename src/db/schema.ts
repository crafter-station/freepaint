import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const paintings = pgTable("paintings", {
  id: uuid("id").defaultRandom().primaryKey(),
  fingerprint: text("fingerprint").notNull(),
  name: text("name").notNull().default("Untitled"),
  data: text("data").notNull(), // base64 canvas data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Painting = typeof paintings.$inferSelect;
export type NewPainting = typeof paintings.$inferInsert;
