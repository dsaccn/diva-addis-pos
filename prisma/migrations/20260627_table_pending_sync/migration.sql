-- Add pendingSync column to Table model
ALTER TABLE "Table" ADD COLUMN "pendingSync" BOOLEAN NOT NULL DEFAULT true;
-- Mark all existing tables as already synced so they don't re-push unnecessarily
UPDATE "Table" SET "pendingSync" = false;
