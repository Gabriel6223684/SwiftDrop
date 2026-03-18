import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    photo: varchar('photo', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const resetCodes = pgTable('reset_codes', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 100 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    used: boolean('used').default(false),
});
