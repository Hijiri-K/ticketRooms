-- CreateTable
CREATE TABLE "ticket_types" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add ticket_type_id column (nullable first)
ALTER TABLE "tickets" ADD COLUMN "ticket_type_id" TEXT;

-- Migrate existing data: create a TicketType for each Event using its price/capacity
INSERT INTO "ticket_types" ("id", "event_id", "name", "price", "capacity", "sort_order", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    '一般',
    "price",
    "capacity",
    0,
    NOW(),
    NOW()
FROM "events";

-- Link existing tickets to their event's TicketType
UPDATE "tickets" t
SET "ticket_type_id" = tt."id"
FROM "ticket_types" tt
WHERE tt."event_id" = t."event_id";

-- Make ticket_type_id NOT NULL
ALTER TABLE "tickets" ALTER COLUMN "ticket_type_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old columns from events
ALTER TABLE "events" DROP COLUMN "price";
ALTER TABLE "events" DROP COLUMN "capacity";
