/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Brand_name_key` ON `Brand`;

-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Marker` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLogin` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Brand_name_userId_key` ON `Brand`(`name`, `userId`);

-- AddForeignKey
ALTER TABLE `Brand` ADD CONSTRAINT `Brand_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marker` ADD CONSTRAINT `Marker_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
