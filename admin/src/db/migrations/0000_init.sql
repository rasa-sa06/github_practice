CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"line_chat_url" text,
	"line_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_line_user_id_unique" UNIQUE("line_user_id")
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"batch_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"total_pieces" integer DEFAULT 1 NOT NULL,
	"brief" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;