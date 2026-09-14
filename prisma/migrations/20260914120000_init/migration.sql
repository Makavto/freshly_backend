-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('PIECE', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PACK');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "expiresAt" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" "ProductUnit",
    "categoryId" INTEGER NOT NULL,
    "storageLocationId" INTEGER NOT NULL,
    "photoKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_lower_key" ON "User" (lower("nickname"));

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
  (1, 'Без категории', NULL, CURRENT_TIMESTAMP),
  (2, 'Молочные', NULL, CURRENT_TIMESTAMP),
  (3, 'Мясо и рыба', NULL, CURRENT_TIMESTAMP),
  (4, 'Овощи', NULL, CURRENT_TIMESTAMP),
  (5, 'Фрукты', NULL, CURRENT_TIMESTAMP),
  (6, 'Выпечка', NULL, CURRENT_TIMESTAMP),
  (7, 'Напитки', NULL, CURRENT_TIMESTAMP),
  (8, 'Заморозка', NULL, CURRENT_TIMESTAMP),
  (9, 'Бакалея', NULL, CURRENT_TIMESTAMP),
  (10, 'Другое', NULL, CURRENT_TIMESTAMP);

INSERT INTO "StorageLocation" ("id", "name", "userId", "updatedAt") VALUES
  (1, 'Не указано', NULL, CURRENT_TIMESTAMP),
  (2, 'Холодильник', NULL, CURRENT_TIMESTAMP),
  (3, 'Морозилка', NULL, CURRENT_TIMESTAMP),
  (4, 'Кухонный шкаф', NULL, CURRENT_TIMESTAMP),
  (5, 'Кладовая', NULL, CURRENT_TIMESTAMP),
  (6, 'Другое', NULL, CURRENT_TIMESTAMP);

SELECT setval(pg_get_serial_sequence('"Category"', 'id'), (SELECT MAX(id) FROM "Category"));
SELECT setval(pg_get_serial_sequence('"StorageLocation"', 'id'), (SELECT MAX(id) FROM "StorageLocation"));
