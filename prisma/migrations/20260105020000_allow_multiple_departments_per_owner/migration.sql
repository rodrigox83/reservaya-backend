-- DropConstraint: Remove unique constraint from email
ALTER TABLE "Owner" DROP CONSTRAINT IF EXISTS "Owner_email_key";

-- DropConstraint: Remove unique constraint from dni
ALTER TABLE "Owner" DROP CONSTRAINT IF EXISTS "Owner_dni_key";

-- CreateIndex: Add regular index on dni for performance
CREATE INDEX IF NOT EXISTS "Owner_dni_idx" ON "Owner"("dni");

-- CreateIndex: Add regular index on email for performance
CREATE INDEX IF NOT EXISTS "Owner_email_idx" ON "Owner"("email");
