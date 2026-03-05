-- CreateTable
CREATE TABLE "lottery_prizes" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "require_redeem" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lottery_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_results" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "prize_id" TEXT,
    "redeemed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lottery_results_event_id_user_id_key" ON "lottery_results"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "lottery_prizes" ADD CONSTRAINT "lottery_prizes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "lottery_prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
