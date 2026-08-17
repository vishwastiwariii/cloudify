-- DropIndex
DROP INDEX "File_deletedAt_idx";

-- DropIndex
DROP INDEX "File_folderId_idx";

-- DropIndex
DROP INDEX "File_storageKey_idx";

-- CreateIndex
CREATE INDEX "File_ownerId_deletedAt_idx" ON "File"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "File_ownerId_folderId_deletedAt_idx" ON "File"("ownerId", "folderId", "deletedAt");

-- CreateIndex
CREATE INDEX "File_ownerId_createdAt_idx" ON "File"("ownerId", "createdAt");
