-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('RESIDENT', 'FRIEND', 'TENANT', 'AIRBNB');

-- CreateEnum
CREATE TYPE "PoolAccessStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tower" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "apartment" TEXT NOT NULL,
    "ownerId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tower" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "grillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolGuest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT,
    "guestType" "GuestType" NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolAccess" (
    "id" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "guestType" "GuestType",
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedHours" INTEGER NOT NULL,
    "expectedExitTime" TIMESTAMP(3) NOT NULL,
    "actualExitTime" TIMESTAMP(3),
    "status" "PoolAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,
    "guestId" TEXT,

    CONSTRAINT "PoolAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolConfig" (
    "id" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 25,
    "openingTime" TEXT NOT NULL DEFAULT '08:00',
    "closingTime" TEXT NOT NULL DEFAULT '22:00',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_departmentCode_key" ON "Owner"("departmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_ownerId_key" ON "User"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tower_floor_apartment_key" ON "User"("tower", "floor", "apartment");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_grillId_date_key" ON "Reservation"("grillId", "date");

-- CreateIndex
CREATE INDEX "PoolGuest_departmentCode_idx" ON "PoolGuest"("departmentCode");

-- CreateIndex
CREATE INDEX "PoolAccess_departmentCode_idx" ON "PoolAccess"("departmentCode");

-- CreateIndex
CREATE INDEX "PoolAccess_status_idx" ON "PoolAccess"("status");

-- CreateIndex
CREATE INDEX "PoolAccess_entryTime_idx" ON "PoolAccess"("entryTime");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_grillId_fkey" FOREIGN KEY ("grillId") REFERENCES "Grill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolGuest" ADD CONSTRAINT "PoolGuest_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAccess" ADD CONSTRAINT "PoolAccess_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAccess" ADD CONSTRAINT "PoolAccess_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "PoolGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
