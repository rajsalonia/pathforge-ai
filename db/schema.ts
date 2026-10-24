import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// One canonical learner snapshot. Its revision is a compare-and-swap token.
export const workspaces = sqliteTable("workspaces", {
  userId: text("user_id").primaryKey(),
  state: text("state").notNull(),
  revision: integer("revision").notNull().default(1),
});

// Reserved for independently recorded assessment services. Browser task results
// currently live in the snapshot; this table does not imply server attestation.
export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  missionId: text("mission_id").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rooms = sqliteTable("rooms", {
  code: text("code").primaryKey(),
  createdAt: text("created_at").notNull(),
});

export const roomMembers = sqliteTable("room_members", {
  roomCode: text("room_code").notNull().references(() => rooms.code, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role", { enum: ["structure", "behavior"] }).notNull(),
  name: text("name").notNull(),
  joinedAt: text("joined_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.roomCode, table.userId] }),
  uniqueIndex("room_role_unique").on(table.roomCode, table.role),
]);

export const contributions = sqliteTable("contributions", {
  roomCode: text("room_code").notNull().references(() => rooms.code, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role", { enum: ["structure", "behavior"] }).notNull(),
  content: text("content").notNull(),
  missionId: text("mission_id").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.roomCode, table.userId] }),
  uniqueIndex("contribution_role_unique").on(table.roomCode, table.role),
]);
