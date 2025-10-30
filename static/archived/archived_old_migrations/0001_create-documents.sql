CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'sent', 'canceled');--> statement-breakpoint
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
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_franchise_id_companies_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_versions_idx" ON "document_versions" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_idx" ON "documents" USING btree ("company_id","franchise_id","created_at");--> statement-breakpoint
CREATE INDEX "invoice_company_idx" ON "invoices" USING btree ("company_id","franchise_id","created_at");