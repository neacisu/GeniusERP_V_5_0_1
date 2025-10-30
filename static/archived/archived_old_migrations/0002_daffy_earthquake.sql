CREATE TABLE "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"deal_id" uuid,
	"customer_id" uuid,
	"contact_id" uuid,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"scheduled_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"duration" integer,
	"outcome" text,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"reminder_date" timestamp with time zone,
	"custom_fields" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"company_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"title" text,
	"department" text,
	"decision_maker" boolean DEFAULT false,
	"influence_level" integer DEFAULT 5,
	"preferred_contact_method" text DEFAULT 'email',
	"notes" text,
	"birth_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_contacted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"is_active" boolean DEFAULT true,
	"custom_fields" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "crm_customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"county" text,
	"country" text DEFAULT 'Romania',
	"postal_code" text,
	"type" text DEFAULT 'lead',
	"segment" text,
	"industry" text,
	"source" text,
	"lead_score" integer DEFAULT 0,
	"lead_status" text DEFAULT 'New',
	"lead_qualification_date" timestamp with time zone,
	"owner_id" uuid,
	"fiscal_code" text,
	"registration_number" text,
	"vat_payer" boolean DEFAULT false,
	"website" text,
	"notes" text,
	"annual_revenue" numeric(20, 2),
	"employee_count" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"is_active" boolean DEFAULT true,
	"custom_fields" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "crm_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"from_stage_id" uuid,
	"to_stage_id" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now(),
	"time_in_stage" integer,
	"changed_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "crm_deal_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"pipeline_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(20, 2),
	"currency" text DEFAULT 'RON',
	"probability" numeric(5, 2) DEFAULT '0',
	"expected_close_date" date,
	"actual_close_date" date,
	"deal_type" text DEFAULT 'New Business',
	"priority" text DEFAULT 'medium',
	"source" text,
	"owner_id" uuid,
	"health_score" integer DEFAULT 50,
	"status" text DEFAULT 'open',
	"won_reason" text,
	"lost_reason" text,
	"lost_competitor" text,
	"products" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"is_active" boolean DEFAULT true,
	"custom_fields" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "crm_email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"template_type" text DEFAULT 'custom',
	"variables" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"probability" numeric(5, 2) DEFAULT '0',
	"expected_duration" integer DEFAULT 0,
	"display_order" integer DEFAULT 0,
	"color" text DEFAULT '#808080',
	"stage_type" text DEFAULT 'standard',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "crm_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"target_deal_size" numeric(20, 2),
	"target_conversion_rate" numeric(5, 2),
	"target_cycle_time_days" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "crm_revenue_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"pipeline" numeric(20, 2),
	"weighted" numeric(20, 2),
	"best_case" numeric(20, 2),
	"commit" numeric(20, 2),
	"closed" numeric(20, 2),
	"forecast_accuracy" numeric(5, 2),
	"currency" text DEFAULT 'RON',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"calculated_by" uuid,
	"updated_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "crm_sales_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"target_amount" numeric(20, 2),
	"actual_amount" numeric(20, 2),
	"target_deals" integer,
	"actual_deals" integer,
	"currency" text DEFAULT 'RON',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_scoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"field" text NOT NULL,
	"operator" text NOT NULL,
	"value" text NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"rule_type" text DEFAULT 'demographic',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"entity_type" text NOT NULL,
	"criteria" json NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "crm_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#808080',
	"category" text DEFAULT 'general',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"working_days" numeric(5, 2) NOT NULL,
	"absence_type" varchar(50) NOT NULL,
	"absence_code" varchar(10),
	"medical_leave_code" varchar(10),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"medical_certificate_number" varchar(50),
	"medical_certificate_date" date,
	"medical_certificate_issued_by" text,
	"medical_certificate_file_path" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_anaf_export_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"declaration_type" varchar(10) NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"quarter" integer,
	"status" varchar(50) DEFAULT 'generated' NOT NULL,
	"submission_date" timestamp with time zone,
	"acceptance_date" timestamp with time zone,
	"rejection_reason" text,
	"declaration_number" varchar(50),
	"registration_number" varchar(50),
	"declaration_file_path" text,
	"receipt_file_path" text,
	"employee_count" integer NOT NULL,
	"gross_salary_total" numeric(12, 2) NOT NULL,
	"cas_employee_total" numeric(12, 2) NOT NULL,
	"cass_employee_total" numeric(12, 2) NOT NULL,
	"income_tax_total" numeric(12, 2) NOT NULL,
	"cam_employer_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_commission_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"structure_type" varchar(50) NOT NULL,
	"calculation_period" varchar(20) DEFAULT 'monthly' NOT NULL,
	"base_percentage" numeric(5, 2),
	"tiers_definition" json DEFAULT '[]'::json,
	"target_metrics" json DEFAULT '{}'::json,
	"calculation_formula" text,
	"minimum_qualifying_amount" numeric(12, 2),
	"maximum_commission_cap" numeric(12, 2),
	"valid_from" date NOT NULL,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"parent_department_id" uuid,
	"manager_id" uuid,
	"cost_center" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_employee_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"commission_structure_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"target_amount" numeric(12, 2),
	"achieved_amount" numeric(12, 2),
	"achievement_percentage" numeric(5, 2),
	"calculated_commission" numeric(12, 2),
	"adjustment_amount" numeric(12, 2) DEFAULT '0',
	"adjustment_reason" text,
	"final_commission_amount" numeric(12, 2),
	"status" varchar(50) DEFAULT 'calculated' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_in_payroll_id" uuid,
	"performance_metrics" json DEFAULT '{}'::json,
	"calculation_details" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"personal_email" text,
	"personal_phone" text,
	"cnp" varchar(13) NOT NULL,
	"id_series_number" varchar(20),
	"birth_date" date,
	"birth_place" text,
	"nationality" text DEFAULT 'Romanian',
	"address" text,
	"city" text,
	"county" text,
	"postal_code" varchar(10),
	"position" text NOT NULL,
	"department" text,
	"manager_employee_id" uuid,
	"is_active" boolean DEFAULT true,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_employment_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"revisal_id" varchar(50),
	"contract_type" varchar(50) DEFAULT 'full_time' NOT NULL,
	"duration_type" varchar(50) DEFAULT 'indefinite' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"suspended_from" date,
	"suspended_until" date,
	"termination_date" date,
	"termination_reason" text,
	"working_hours_per_day" numeric(5, 2) DEFAULT '8' NOT NULL,
	"working_hours_per_week" numeric(5, 2) DEFAULT '40' NOT NULL,
	"base_salary_gross" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON' NOT NULL,
	"payment_interval" varchar(20) DEFAULT 'monthly' NOT NULL,
	"caen_code" varchar(10),
	"cor_code" varchar(10) NOT NULL,
	"annual_leave_entitlement" integer DEFAULT 21,
	"is_telemunca_possible" boolean DEFAULT false,
	"has_competition_clause" boolean DEFAULT false,
	"has_confidentiality_clause" boolean DEFAULT true,
	"contract_file_path" text,
	"annexes_file_paths" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_job_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"internal_code" varchar(20),
	"cor_code" varchar(10) NOT NULL,
	"description" text,
	"responsibilities" text,
	"requirements" text,
	"department_id" uuid,
	"minimum_salary" numeric(12, 2),
	"maximum_salary" numeric(12, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_payroll_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employment_contract_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"payment_date" date,
	"working_days_in_month" smallint NOT NULL,
	"worked_days" numeric(5, 2) NOT NULL,
	"base_salary_gross" numeric(12, 2) NOT NULL,
	"gross_total" numeric(12, 2) NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0',
	"overtime_amount" numeric(12, 2) DEFAULT '0',
	"meal_tickets_count" integer DEFAULT 0,
	"meal_tickets_value" numeric(12, 2) DEFAULT '0',
	"gift_tickets_value" numeric(12, 2) DEFAULT '0',
	"vacation_tickets_value" numeric(12, 2) DEFAULT '0',
	"bonuses" numeric(12, 2) DEFAULT '0',
	"commissions" numeric(12, 2) DEFAULT '0',
	"other_compensations" json DEFAULT '{}'::json,
	"it_exemption_type" varchar(50),
	"cas_basis" numeric(12, 2),
	"cas_employee_amount" numeric(12, 2),
	"cass_employee_amount" numeric(12, 2),
	"income_tax_amount" numeric(12, 2),
	"cam_employer_amount" numeric(12, 2),
	"net_salary" numeric(12, 2) NOT NULL,
	"personal_deduction" numeric(12, 2) DEFAULT '0',
	"other_deductions" json DEFAULT '{}'::json,
	"anaf_declaration_status" varchar(50) DEFAULT 'pending',
	"anaf_declaration_date" date,
	"anaf_declaration_number" varchar(50),
	"payslip_file_path" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_revisal_export_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"revisal_version" varchar(20) NOT NULL,
	"export_date" timestamp with time zone NOT NULL,
	"employee_count" integer NOT NULL,
	"new_employee_count" integer NOT NULL,
	"modified_employee_count" integer NOT NULL,
	"suspended_employee_count" integer NOT NULL,
	"terminated_employee_count" integer NOT NULL,
	"export_file_path" text NOT NULL,
	"submission_status" varchar(50) DEFAULT 'generated' NOT NULL,
	"submission_date" date,
	"registration_number" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "hr_work_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employment_contract_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time(0) NOT NULL,
	"end_time" time(0) NOT NULL,
	"break_start_time" time(0),
	"break_end_time" time(0),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hr_work_schedules_employment_contract_id_day_of_week_pk" PRIMARY KEY("employment_contract_id","day_of_week")
);
--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customer_tags" ADD CONSTRAINT "crm_customer_tags_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customer_tags" ADD CONSTRAINT "crm_customer_tags_tag_id_crm_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customer_tags" ADD CONSTRAINT "crm_customer_tags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customer_tags" ADD CONSTRAINT "crm_customer_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stage_history" ADD CONSTRAINT "crm_stage_history_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stage_history" ADD CONSTRAINT "crm_stage_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stage_history" ADD CONSTRAINT "crm_stage_history_from_stage_id_crm_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."crm_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stage_history" ADD CONSTRAINT "crm_stage_history_to_stage_id_crm_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."crm_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stage_history" ADD CONSTRAINT "crm_stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tags" ADD CONSTRAINT "crm_deal_tags_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tags" ADD CONSTRAINT "crm_deal_tags_tag_id_crm_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tags" ADD CONSTRAINT "crm_deal_tags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tags" ADD CONSTRAINT "crm_deal_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_customer_id_crm_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_pipeline_id_crm_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_id_crm_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."crm_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_email_templates" ADD CONSTRAINT "crm_email_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_email_templates" ADD CONSTRAINT "crm_email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_email_templates" ADD CONSTRAINT "crm_email_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_pipeline_id_crm_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipelines" ADD CONSTRAINT "crm_pipelines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipelines" ADD CONSTRAINT "crm_pipelines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipelines" ADD CONSTRAINT "crm_pipelines_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_revenue_forecasts" ADD CONSTRAINT "crm_revenue_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_revenue_forecasts" ADD CONSTRAINT "crm_revenue_forecasts_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_revenue_forecasts" ADD CONSTRAINT "crm_revenue_forecasts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_sales_quotas" ADD CONSTRAINT "crm_sales_quotas_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_sales_quotas" ADD CONSTRAINT "crm_sales_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_sales_quotas" ADD CONSTRAINT "crm_sales_quotas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_sales_quotas" ADD CONSTRAINT "crm_sales_quotas_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_scoring_rules" ADD CONSTRAINT "crm_scoring_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_scoring_rules" ADD CONSTRAINT "crm_scoring_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_scoring_rules" ADD CONSTRAINT "crm_scoring_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_segments" ADD CONSTRAINT "crm_segments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_segments" ADD CONSTRAINT "crm_segments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_segments" ADD CONSTRAINT "crm_segments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tags" ADD CONSTRAINT "crm_tags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tags" ADD CONSTRAINT "crm_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_anaf_export_logs" ADD CONSTRAINT "hr_anaf_export_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_anaf_export_logs" ADD CONSTRAINT "hr_anaf_export_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_anaf_export_logs" ADD CONSTRAINT "hr_anaf_export_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_commission_structures" ADD CONSTRAINT "hr_commission_structures_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_commission_structures" ADD CONSTRAINT "hr_commission_structures_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_commission_structures" ADD CONSTRAINT "hr_commission_structures_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_parent_department_id_hr_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "public"."hr_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_manager_id_hr_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_commission_structure_id_hr_commission_structures_id_fk" FOREIGN KEY ("commission_structure_id") REFERENCES "public"."hr_commission_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_paid_in_payroll_id_hr_payroll_logs_id_fk" FOREIGN KEY ("paid_in_payroll_id") REFERENCES "public"."hr_payroll_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee_commissions" ADD CONSTRAINT "hr_employee_commissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_manager_employee_id_hr_employees_id_fk" FOREIGN KEY ("manager_employee_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employment_contracts" ADD CONSTRAINT "hr_employment_contracts_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employment_contracts" ADD CONSTRAINT "hr_employment_contracts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employment_contracts" ADD CONSTRAINT "hr_employment_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employment_contracts" ADD CONSTRAINT "hr_employment_contracts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_job_positions" ADD CONSTRAINT "hr_job_positions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_job_positions" ADD CONSTRAINT "hr_job_positions_department_id_hr_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."hr_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_job_positions" ADD CONSTRAINT "hr_job_positions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_job_positions" ADD CONSTRAINT "hr_job_positions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_logs" ADD CONSTRAINT "hr_payroll_logs_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hr_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_logs" ADD CONSTRAINT "hr_payroll_logs_employment_contract_id_hr_employment_contracts_id_fk" FOREIGN KEY ("employment_contract_id") REFERENCES "public"."hr_employment_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_logs" ADD CONSTRAINT "hr_payroll_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_logs" ADD CONSTRAINT "hr_payroll_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_logs" ADD CONSTRAINT "hr_payroll_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_revisal_export_logs" ADD CONSTRAINT "hr_revisal_export_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_revisal_export_logs" ADD CONSTRAINT "hr_revisal_export_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_revisal_export_logs" ADD CONSTRAINT "hr_revisal_export_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_employment_contract_id_hr_employment_contracts_id_fk" FOREIGN KEY ("employment_contract_id") REFERENCES "public"."hr_employment_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_schedules" ADD CONSTRAINT "hr_work_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hr_absence_employee_idx" ON "hr_absences" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "hr_absence_company_idx" ON "hr_absences" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_absence_date_range_idx" ON "hr_absences" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "hr_anaf_export_company_idx" ON "hr_anaf_export_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_anaf_export_period_idx" ON "hr_anaf_export_logs" USING btree ("year","month","quarter");--> statement-breakpoint
CREATE INDEX "hr_anaf_export_type_idx" ON "hr_anaf_export_logs" USING btree ("declaration_type");--> statement-breakpoint
CREATE INDEX "hr_commission_structure_company_idx" ON "hr_commission_structures" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_department_company_idx" ON "hr_departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_department_parent_idx" ON "hr_departments" USING btree ("parent_department_id");--> statement-breakpoint
CREATE INDEX "hr_employee_commission_employee_idx" ON "hr_employee_commissions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "hr_employee_commission_structure_idx" ON "hr_employee_commissions" USING btree ("commission_structure_id");--> statement-breakpoint
CREATE INDEX "hr_employee_commission_company_idx" ON "hr_employee_commissions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_employee_commission_period_idx" ON "hr_employee_commissions" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "hr_employee_company_idx" ON "hr_employees" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_employee_cnp_idx" ON "hr_employees" USING btree ("cnp");--> statement-breakpoint
CREATE INDEX "hr_employment_contract_employee_idx" ON "hr_employment_contracts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "hr_employment_contract_company_idx" ON "hr_employment_contracts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_employment_contract_number_idx" ON "hr_employment_contracts" USING btree ("contract_number");--> statement-breakpoint
CREATE INDEX "hr_job_position_company_idx" ON "hr_job_positions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_job_position_department_idx" ON "hr_job_positions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "hr_job_position_cor_idx" ON "hr_job_positions" USING btree ("cor_code");--> statement-breakpoint
CREATE INDEX "hr_payroll_employee_idx" ON "hr_payroll_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "hr_payroll_company_idx" ON "hr_payroll_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_payroll_period_idx" ON "hr_payroll_logs" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "hr_revisal_export_company_idx" ON "hr_revisal_export_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hr_revisal_export_date_idx" ON "hr_revisal_export_logs" USING btree ("export_date");--> statement-breakpoint
CREATE INDEX "hr_work_schedule_contract_idx" ON "hr_work_schedules" USING btree ("employment_contract_id");--> statement-breakpoint
CREATE INDEX "hr_work_schedule_company_idx" ON "hr_work_schedules" USING btree ("company_id");