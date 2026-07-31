-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isVerified" SET DEFAULT true,
ALTER COLUMN "avatar" DROP NOT NULL;
