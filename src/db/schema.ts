import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  email: varchar("email", { length: 256 }).notNull().unique(),
});

export const chirps = pgTable(
  "chirps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    body: varchar("body").notNull(),
    userId: uuid("userId").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "custom_fk",
    }).onDelete("cascade"),
  ],
);

export type NewUser = typeof users.$inferInsert;
export type NewChirp = typeof chirps.$inferInsert;
