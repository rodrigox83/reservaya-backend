-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'PASSPORT', 'CE', 'OTHER');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'DNI',
    "documentNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "departmentCode" TEXT NOT NULL,
    "guestType" "GuestType" NOT NULL DEFAULT 'AIRBNB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guest_departmentCode_idx" ON "Guest"("departmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_documentType_documentNumber_key" ON "Guest"("documentType", "documentNumber");
