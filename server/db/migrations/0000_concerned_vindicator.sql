CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."charger_status" AS ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."station_status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'OPERATOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"charger_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"total_price" numeric,
	"booking_reference" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chargers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"charger_code" text NOT NULL,
	"connector_type" text NOT NULL,
	"power_output_kw" numeric NOT NULL,
	"current_type" text,
	"status" charger_status DEFAULT 'AVAILABLE' NOT NULL,
	"estimated_available_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charging_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"charger_id" uuid NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"energy_consumed_kwh" numeric,
	"session_status" "session_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"rating" numeric NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"state" text,
	"country" text,
	"pincode" text,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"status" "station_status" DEFAULT 'ACTIVE' NOT NULL,
	"opening_time" time,
	"closing_time" time,
	"pricing_details" jsonb,
	"amenities" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vehicle_name" text NOT NULL,
	"brand" text,
	"model" text,
	"connector_type" text,
	"battery_capacity" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_charger_id_chargers_id_fk" FOREIGN KEY ("charger_id") REFERENCES "public"."chargers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chargers" ADD CONSTRAINT "chargers_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_charger_id_chargers_id_fk" FOREIGN KEY ("charger_id") REFERENCES "public"."chargers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_charger_time_idx" ON "bookings" USING btree ("charger_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" USING btree ("booking_reference");--> statement-breakpoint
CREATE INDEX "chargers_station_id_idx" ON "chargers" USING btree ("station_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chargers_station_code_idx" ON "chargers" USING btree ("station_id","charger_code");--> statement-breakpoint
CREATE INDEX "charging_sessions_charger_id_idx" ON "charging_sessions" USING btree ("charger_id");--> statement-breakpoint
CREATE INDEX "charging_sessions_booking_id_idx" ON "charging_sessions" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_station_idx" ON "favorites" USING btree ("user_id","station_id");--> statement-breakpoint
CREATE INDEX "reviews_station_id_idx" ON "reviews" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "stations_operator_id_idx" ON "stations" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "stations_location_idx" ON "stations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vehicles_user_id_idx" ON "vehicles" USING btree ("user_id");