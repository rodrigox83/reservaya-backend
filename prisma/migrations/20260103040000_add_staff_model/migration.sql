-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'RECEPTIONIST');

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN "dni" TEXT;

-- Update existing owners with a default dni (will need to be updated manually)
UPDATE "Owner" SET "dni" = CONCAT('DNI-', id) WHERE "dni" IS NULL;

-- Make dni NOT NULL after setting defaults
ALTER TABLE "Owner" ALTER COLUMN "dni" SET NOT NULL;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_username_key" ON "Staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_dni_key" ON "Owner"("dni");
