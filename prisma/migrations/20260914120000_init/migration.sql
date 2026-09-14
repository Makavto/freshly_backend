-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('PIECE', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expiresAt" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" "ProductUnit",
    "categoryId" TEXT NOT NULL,
    "storageLocationId" TEXT NOT NULL,
    "photoKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "StorageLocation_userId_idx" ON "StorageLocation"("userId");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "Product_userId_expiresAt_idx" ON "Product"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Product_userId_name_idx" ON "Product"("userId", "name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_storageLocationId_idx" ON "Product"("storageLocationId");

CREATE UNIQUE INDEX "Category_preset_name_key" ON "Category" ("name") WHERE "userId" IS NULL;
CREATE UNIQUE INDEX "Category_user_name_key" ON "Category" ("userId", "name") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "StorageLocation_preset_name_key" ON "StorageLocation" ("name") WHERE "userId" IS NULL;
CREATE UNIQUE INDEX "StorageLocation_user_name_key" ON "StorageLocation" ("userId", "name") WHERE "userId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Category" ("id", "name", "userId", "updatedAt") VALUES
  ('00000000-0000-4000-8000-000000000001', 'Без категории', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'Молочные', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000003', 'Мясо и рыба', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000004', 'Овощи', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000005', 'Фрукты', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000006', 'Выпечка', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000007', 'Напитки', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000008', 'Заморозка', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000009', 'Бакалея', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-00000000000a', 'Другое', NULL, CURRENT_TIMESTAMP);

INSERT INTO "StorageLocation" ("id", "name", "userId", "updatedAt") VALUES
  ('00000000-0000-4000-8000-000000000101', 'Не указано', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000102', 'Холодильник', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000103', 'Морозилка', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000104', 'Кухонный шкаф', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000105', 'Кладовая', NULL, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000106', 'Другое', NULL, CURRENT_TIMESTAMP);
