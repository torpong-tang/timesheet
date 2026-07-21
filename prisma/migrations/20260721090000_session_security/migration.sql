-- Existing accounts predate the strong-password policy. Force a one-time
-- password change while preserving every account and its related records.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "User_mustChangePassword_idx" ON "User"("mustChangePassword");
