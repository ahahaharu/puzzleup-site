CREATE TYPE "public"."availability" AS ENUM('available', 'few', 'full');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('telegram', 'viber', 'call');--> statement-breakpoint
CREATE TYPE "public"."contact_time" AS ENUM('morning', 'day', 'evening', 'any');--> statement-breakpoint
CREATE TYPE "public"."entry" AS ENUM('hero', 'header', 'bottom_bar', 'tutors', 'situations', 'subjects', 'prices', 'faq', 'about', 'tutor_profile', 'tutor_more', 'tutor_full', '404', 'direct');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('grades', 'exam9', 'ct', 'olymp');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('form', 'telegram', 'viber', 'call', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'no_answer', 'trial_scheduled', 'trial_done', 'student', 'rejected', 'waitlist');--> statement-breakpoint
CREATE TYPE "public"."rejection_reason" AS ENUM('expensive', 'schedule', 'chose_other', 'no_response', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_event_type" AS ENUM('created', 'status_changed');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'done', 'dead');--> statement-breakpoint
CREATE TYPE "public"."outbox_type" AS ENUM('telegram.lead_created', 'telegram.lead_updated', 'telegram.reminder', 'telegram.alert', 'sheets.upsert');--> statement-breakpoint
CREATE TABLE "tutor_availability" (
	"tutor_id" text PRIMARY KEY NOT NULL,
	"status" "availability" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_dialogs" (
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" text NOT NULL,
	"step" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bot_dialogs_chat_id_user_id_pk" PRIMARY KEY("chat_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "consents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lead_id" bigint NOT NULL,
	"given_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consent_version" text NOT NULL,
	"consent_text_sha256" text NOT NULL,
	CONSTRAINT "consents_sha256_check" CHECK ("consents"."consent_text_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lead_id" bigint NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "lead_event_type" NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"actor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1001 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tutor_id" text NOT NULL,
	"source" "lead_source" NOT NULL,
	"parent_name" text,
	"phone" text,
	"contact_method" "contact_method",
	"grade" smallint NOT NULL,
	"subjects" text[] NOT NULL,
	"goal" "goal",
	"contact_time" "contact_time"[] DEFAULT '{}' NOT NULL,
	"comment" text,
	"entry" "entry",
	"landing_path" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"availability_at_submit" "availability",
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_changed_by" text,
	"rejection_reason" "rejection_reason",
	"trial_done_at" timestamp with time zone,
	"student_at" timestamp with time zone,
	"telegram_message_id" bigint,
	"reminder_sent_at" timestamp with time zone,
	CONSTRAINT "leads_form_fields_check" CHECK ("leads"."source" <> 'form' OR ("leads"."parent_name" IS NOT NULL AND "leads"."phone" IS NOT NULL AND "leads"."contact_method" IS NOT NULL AND "leads"."entry" IS NOT NULL AND "leads"."landing_path" IS NOT NULL)),
	CONSTRAINT "leads_phone_check" CHECK ("leads"."phone" ~ '^\+[1-9][0-9]{7,14}$'),
	CONSTRAINT "leads_grade_check" CHECK ("leads"."grade" BETWEEN 1 AND 11),
	CONSTRAINT "leads_subjects_check" CHECK (cardinality("leads"."subjects") > 0),
	CONSTRAINT "leads_comment_check" CHECK (char_length("leads"."comment") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "outbox_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" "outbox_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consents_lead_id_idx" ON "consents" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_events_lead_id_idx" ON "lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_status_created_at_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_status_changed_at_idx" ON "leads" USING btree ("status_changed_at");--> statement-breakpoint
CREATE INDEX "outbox_status_run_at_idx" ON "outbox" USING btree ("status","run_at");