-- Add local-only sync bookkeeping flag to staff metadata tables so that
-- locally-created records survive pullFromCloud() and get pushed to Neon.
ALTER TABLE "StaffMember" ADD COLUMN "pendingSync" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StaffMenuItem" ADD COLUMN "pendingSync" BOOLEAN NOT NULL DEFAULT true;
