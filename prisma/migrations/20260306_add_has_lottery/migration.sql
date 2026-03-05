-- AlterTable
ALTER TABLE "events" ADD COLUMN "has_lottery" BOOLEAN NOT NULL DEFAULT false;

-- Set has_lottery = true for events that already have lottery prizes
UPDATE "events" SET "has_lottery" = true WHERE "id" IN (SELECT DISTINCT "event_id" FROM "lottery_prizes");
