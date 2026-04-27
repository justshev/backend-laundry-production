-- CreateTable
CREATE TABLE "WhatsAppRatingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'waiting_rating',
    "rating" INTEGER,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppRatingSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppRatingSession_orderId_key" ON "WhatsAppRatingSession"("orderId");

-- CreateIndex
CREATE INDEX "WhatsAppRatingSession_normalizedPhone_state_updatedAt_idx" ON "WhatsAppRatingSession"("normalizedPhone", "state", "updatedAt");
