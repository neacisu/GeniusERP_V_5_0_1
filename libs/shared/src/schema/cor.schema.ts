/**
 * COR Schema - Clasificarea Ocupatiilor din Romania (Romanian Occupation Classification)
 * 
 * This schema implements the COR table structure following the official Romanian standards:
 * - Major groups (1 digit)
 * - Submajor groups (2 digits)
 * - Minor groups (3 digits)
 * - Subminor groups (4 digits)
 * - Occupations (6 digits)
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
  primaryKey,
  unique,
  boolean
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * COR Major Groups (1 digit)
 * The top level groups in COR classification (0-9)
 */
export const cor_major_groups = pgTable("cor_major_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 1 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  codeIdx: index("cor_major_group_code_idx").on(table.code),
  codeUnique: unique("cor_major_group_code_unique").on(table.code)
}));

/**
 * COR Submajor Groups (2 digits)
 * The second level groups in COR classification
 * First digit comes from major group, second digit is 0-9
 */
export const cor_submajor_groups = pgTable("cor_submajor_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 2 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  majorGroupCode: varchar("major_group_code", { length: 1 }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  codeIdx: index("cor_submajor_group_code_idx").on(table.code),
  majorGroupCodeIdx: index("cor_submajor_group_major_code_idx").on(table.majorGroupCode),
  codeUnique: unique("cor_submajor_group_code_unique").on(table.code)
}));

/**
 * COR Minor Groups (3 digits)
 * The third level groups in COR classification
 * First two digits from submajor group, third digit is 0-9
 */
export const cor_minor_groups = pgTable("cor_minor_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 3 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  submajorGroupCode: varchar("submajor_group_code", { length: 2 }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  codeIdx: index("cor_minor_group_code_idx").on(table.code),
  submajorGroupCodeIdx: index("cor_minor_group_submajor_code_idx").on(table.submajorGroupCode),
  codeUnique: unique("cor_minor_group_code_unique").on(table.code)
}));

/**
 * COR Subminor Groups (4 digits)
 * The fourth level groups in COR classification
 * First three digits from minor group, fourth digit is 0-9
 */
export const cor_subminor_groups = pgTable("cor_subminor_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 4 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  minorGroupCode: varchar("minor_group_code", { length: 3 }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  codeIdx: index("cor_subminor_group_code_idx").on(table.code),
  minorGroupCodeIdx: index("cor_subminor_group_minor_code_idx").on(table.minorGroupCode),
  codeUnique: unique("cor_subminor_group_code_unique").on(table.code)
}));

/**
 * COR Occupations (6 digits)
 * The actual occupations in the COR classification
 * First 4 digits from the subminor group, last 2 digits are specific to the occupation
 */
export const cor_occupations = pgTable("cor_occupations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 6 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  subminorGroupCode: varchar("subminor_group_code", { length: 4 }).notNull(),
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  codeIdx: index("cor_occupation_code_idx").on(table.code),
  subminorGroupCodeIdx: index("cor_occupation_subminor_code_idx").on(table.subminorGroupCode),
  codeUnique: unique("cor_occupation_code_unique").on(table.code)
}));