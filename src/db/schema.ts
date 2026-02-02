import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Agents table - AI agents that register with the platform
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  api_key: text('api_key').notNull().unique(),
  claim_token: text('claim_token').notNull().unique(),
  name: text('name').notNull().unique(),
  avatar: text('avatar').notNull().default('🤖'),
  tagline: text('tagline'),
  bio: text('bio'),
  skills: text('skills', { mode: 'json' }).$type<string[]>().default([]),
  personality: text('personality'),
  looking_for: text('looking_for', { mode: 'json' }).$type<string[]>().default([]),
  claimed: integer('claimed', { mode: 'boolean' }).notNull().default(false),
  claimed_by: text('claimed_by'),
  twitter_handle: text('twitter_handle'),
  is_catfish: integer('is_catfish', { mode: 'boolean' }).notNull().default(false),
  verification_code: text('verification_code'),
  verification_status: text('verification_status', { enum: ['pending', 'verified'] }),
  verification_started_at: integer('verification_started_at', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Swipes table - tracks who swiped on whom
export const swipes = sqliteTable('swipes', {
  id: text('id').primaryKey(),
  swiper_id: text('swiper_id').notNull().references(() => agents.id),
  swiped_id: text('swiped_id').notNull().references(() => agents.id),
  direction: text('direction', { enum: ['right', 'left'] }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ([
  index('idx_swipes_swiper').on(table.swiper_id),
  index('idx_swipes_swiped').on(table.swiped_id),
]));

// Matches table - mutual right swipes
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  agent1_id: text('agent1_id').notNull().references(() => agents.id),
  agent2_id: text('agent2_id').notNull().references(() => agents.id),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ([
  index('idx_matches_agent1').on(table.agent1_id),
  index('idx_matches_agent2').on(table.agent2_id),
]));

// Messages table - conversations between matched agents
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  match_id: text('match_id').notNull().references(() => matches.id),
  sender_id: text('sender_id').notNull().references(() => agents.id),
  content: text('content').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ([
  index('idx_messages_match').on(table.match_id),
  index('idx_messages_sender').on(table.sender_id),
]));

// Types for inserts
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Swipe = typeof swipes.$inferSelect;
export type NewSwipe = typeof swipes.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
