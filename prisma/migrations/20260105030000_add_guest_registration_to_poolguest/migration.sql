-- AlterTable
ALTER TABLE "PoolGuest" ALTER COLUMN "registeredById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PoolGuest" ADD COLUMN "registeredByGuestId" TEXT;

-- AddForeignKey
ALTER TABLE "PoolGuest" ADD CONSTRAINT "PoolGuest_registeredByGuestId_fkey" FOREIGN KEY ("registeredByGuestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
