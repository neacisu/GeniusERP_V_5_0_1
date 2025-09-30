CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'sent', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."gestiune_type" AS ENUM('depozit', 'magazin', 'custodie', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."nir_status" AS ENUM('draft', 'approved', 'canceled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('draft', 'pending', 'approved', 'received', 'partially_received', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('draft', 'in_transit', 'partially_received', 'received', 'canceled');--> statement-breakpoint
CREATE TABLE "account_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"fiscal_month" integer NOT NULL,
	"opening_debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"opening_credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"period_debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"period_credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"closing_debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"closing_credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(1) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_account_function" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_classes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "account_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(2) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"class_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"class_id" uuid NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true,
	"synthetic_id" uuid,
	"analytic_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "analytic_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"synthetic_id" uuid NOT NULL,
	"account_function" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytic_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"fiscal_code" text NOT NULL,
	"registration_number" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"county" text NOT NULL,
	"country" text DEFAULT 'Romania' NOT NULL,
	"phone" text,
	"email" text,
	"bank_account" text,
	"bank_name" text,
	"vat_payer" boolean DEFAULT true,
	"vat_rate" integer DEFAULT 19,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_fiscal_code_unique" UNIQUE("fiscal_code")
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"file_path" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"ocr_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" varchar(5) NOT NULL,
	"rate" numeric(10, 4) NOT NULL,
	"source" varchar(20) DEFAULT 'BNR' NOT NULL,
	"base_currency" varchar(5) DEFAULT 'RON' NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fx_rates_currency_date_source_base_currency_unique" UNIQUE("currency","date","source","base_currency")
);
--> statement-breakpoint
CREATE TABLE "inventory_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"unit_id" uuid,
	"purchase_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"selling_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"vat_rate" integer DEFAULT 19,
	"stock_alert" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inventory_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"quantity" numeric(15, 2) DEFAULT '0' NOT NULL,
	"average_cost" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"document_number" text,
	"document_type" text NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total_value" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"partner_id" uuid,
	"partner_name" text NOT NULL,
	"partner_fiscal_code" text NOT NULL,
	"partner_registration_number" text,
	"partner_address" text NOT NULL,
	"partner_city" text NOT NULL,
	"partner_county" text,
	"partner_country" text DEFAULT 'Romania' NOT NULL,
	"payment_method" text NOT NULL,
	"payment_due_days" integer DEFAULT 30 NOT NULL,
	"payment_due_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"vat_rate" integer DEFAULT 19 NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"series" varchar(8),
	"number" integer,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(5) DEFAULT 'RON' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "invoice_series_number_unique" UNIQUE("series","number")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"number" text,
	"reference" text,
	"description" text,
	"total_debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "synthetic_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"account_function" text NOT NULL,
	"grade" integer NOT NULL,
	"group_id" uuid NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "synthetic_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"company_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nir_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"nir_number" varchar(50) NOT NULL,
	"supplier_invoice_number" varchar(50),
	"supplier_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"warehouse_type" "gestiune_type" NOT NULL,
	"is_custody" boolean DEFAULT false,
	"status" "nir_status" DEFAULT 'draft',
	"receipt_date" timestamp DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text,
	"total_value_no_vat" numeric(15, 2) DEFAULT '0',
	"total_vat" numeric(15, 2) DEFAULT '0',
	"total_value_with_vat" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nir_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nir_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"batch_no" varchar(50),
	"expiry_date" date,
	"purchase_price" numeric(15, 2) NOT NULL,
	"purchase_price_with_vat" numeric(15, 2),
	"selling_price" numeric(15, 2),
	"selling_price_with_vat" numeric(15, 2),
	"vat_rate" integer DEFAULT 19,
	"vat_value" numeric(15, 2) DEFAULT '0',
	"total_value_no_vat" numeric(15, 2) DEFAULT '0',
	"total_value_with_vat" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_received" numeric(15, 3) DEFAULT '0',
	"unit_price" numeric(15, 2) NOT NULL,
	"vat_rate" integer DEFAULT 19,
	"vat_value" numeric(15, 2) DEFAULT '0',
	"total_value_no_vat" numeric(15, 2) DEFAULT '0',
	"total_value_with_vat" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"po_number" varchar(50) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"status" "po_status" DEFAULT 'draft',
	"is_custody" boolean DEFAULT false,
	"expected_date" date,
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text,
	"total_value_no_vat" numeric(15, 2) DEFAULT '0',
	"total_vat" numeric(15, 2) DEFAULT '0',
	"total_value_with_vat" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"nir_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"quantity" numeric(15, 3) DEFAULT '0' NOT NULL,
	"quantity_reserved" numeric(15, 3) DEFAULT '0',
	"batch_no" varchar(50),
	"expiry_date" date,
	"purchase_price" numeric(15, 2) DEFAULT '0',
	"selling_price" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transfer_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"transfer_number" varchar(50) NOT NULL,
	"source_warehouse_id" uuid NOT NULL,
	"destination_warehouse_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'draft',
	"transfer_date" timestamp DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"received_by" uuid,
	"received_at" timestamp,
	"nir_id" uuid,
	"notes" text,
	"total_value" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_received" numeric(15, 3) DEFAULT '0',
	"batch_no" varchar(50),
	"expiry_date" date,
	"unit_value" numeric(15, 2) NOT NULL,
	"total_value" numeric(15, 2) DEFAULT '0',
	"currency" varchar(5) DEFAULT 'RON',
	"exchange_rate" numeric(10, 4) DEFAULT '1',
	"exchange_rate_source" varchar(20) DEFAULT 'BNR',
	"exchange_rate_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"franchise_id" uuid,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"location" varchar(150),
	"address" text,
	"type" "gestiune_type" NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_groups" ADD CONSTRAINT "account_groups_class_id_account_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."account_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_class_id_account_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."account_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_accounts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_synthetic_id_synthetic_accounts_id_fk" FOREIGN KEY ("synthetic_id") REFERENCES "public"."synthetic_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_analytic_id_analytic_accounts_id_fk" FOREIGN KEY ("analytic_id") REFERENCES "public"."analytic_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytic_accounts" ADD CONSTRAINT "analytic_accounts_synthetic_id_synthetic_accounts_id_fk" FOREIGN KEY ("synthetic_id") REFERENCES "public"."synthetic_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_franchise_id_companies_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_parent_id_inventory_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."inventory_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inventory_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_unit_id_inventory_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."inventory_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synthetic_accounts" ADD CONSTRAINT "synthetic_accounts_group_id_account_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."account_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synthetic_accounts" ADD CONSTRAINT "synthetic_accounts_parent_id_synthetic_accounts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."synthetic_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_scope_idx" ON "audit_logs" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "document_versions_idx" ON "document_versions" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_idx" ON "documents" USING btree ("company_id","franchise_id","created_at");--> statement-breakpoint
CREATE INDEX "invoice_company_idx" ON "invoices" USING btree ("company_id","franchise_id","created_at");--> statement-breakpoint
CREATE INDEX "roles_company_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "nir_number_idx" ON "nir_documents" USING btree ("nir_number");--> statement-breakpoint
CREATE INDEX "nir_supplier_idx" ON "nir_documents" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "nir_warehouse_idx" ON "nir_documents" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "nir_company_idx" ON "nir_documents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "nir_franchise_idx" ON "nir_documents" USING btree ("franchise_id");--> statement-breakpoint
CREATE INDEX "nir_status_idx" ON "nir_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nir_type_idx" ON "nir_documents" USING btree ("warehouse_type");--> statement-breakpoint
CREATE INDEX "nir_date_idx" ON "nir_documents" USING btree ("receipt_date");--> statement-breakpoint
CREATE INDEX "nir_item_nir_idx" ON "nir_items" USING btree ("nir_id");--> statement-breakpoint
CREATE INDEX "nir_item_product_idx" ON "nir_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "po_item_po_idx" ON "purchase_order_items" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "po_item_product_idx" ON "purchase_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "po_number_idx" ON "purchase_orders" USING btree ("po_number");--> statement-breakpoint
CREATE INDEX "po_supplier_idx" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "po_warehouse_idx" ON "purchase_orders" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "po_company_idx" ON "purchase_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "po_franchise_idx" ON "purchase_orders" USING btree ("franchise_id");--> statement-breakpoint
CREATE INDEX "po_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_product_idx" ON "stocks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_warehouse_idx" ON "stocks" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_company_idx" ON "stocks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stock_franchise_idx" ON "stocks" USING btree ("franchise_id");--> statement-breakpoint
CREATE INDEX "stock_batch_idx" ON "stocks" USING btree ("batch_no");--> statement-breakpoint
CREATE INDEX "transfer_number_idx" ON "transfer_documents" USING btree ("transfer_number");--> statement-breakpoint
CREATE INDEX "transfer_source_idx" ON "transfer_documents" USING btree ("source_warehouse_id");--> statement-breakpoint
CREATE INDEX "transfer_dest_idx" ON "transfer_documents" USING btree ("destination_warehouse_id");--> statement-breakpoint
CREATE INDEX "transfer_company_idx" ON "transfer_documents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "transfer_franchise_idx" ON "transfer_documents" USING btree ("franchise_id");--> statement-breakpoint
CREATE INDEX "transfer_status_idx" ON "transfer_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfer_date_idx" ON "transfer_documents" USING btree ("transfer_date");--> statement-breakpoint
CREATE INDEX "transfer_item_transfer_idx" ON "transfer_items" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "transfer_item_product_idx" ON "transfer_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "warehouse_company_idx" ON "warehouses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "warehouse_franchise_idx" ON "warehouses" USING btree ("franchise_id");--> statement-breakpoint
CREATE INDEX "warehouse_type_idx" ON "warehouses" USING btree ("type");