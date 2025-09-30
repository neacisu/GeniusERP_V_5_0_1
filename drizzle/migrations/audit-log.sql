CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "company_id" uuid NOT NULL,
    "user_id" uuid,
    "action" text NOT NULL,
    "entity" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "details" jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'audit_logs_company_id_companies_id_fk'
    ) THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" 
            FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") 
            ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'audit_logs_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
            ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        WHERE i.indrelid = 'audit_logs'::regclass
        AND a.attname = 'company_id'
        AND a.attnum = ANY(i.indkey)
    ) THEN
        CREATE INDEX "audit_scope_idx" ON "audit_logs" USING btree ("company_id","created_at");
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        WHERE i.indrelid = 'audit_logs'::regclass
        AND a.attname = 'entity'
        AND a.attnum = ANY(i.indkey)
    ) THEN
        CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");
    END IF;
END $$;