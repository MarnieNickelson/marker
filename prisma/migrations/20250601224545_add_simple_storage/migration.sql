-- DropForeignKey
ALTER TABLE `Marker` DROP FOREIGN KEY `Marker_gridId_fkey`;

-- DropIndex
DROP INDEX `Marker_gridId_fkey` ON `Marker`;

-- AlterTable
ALTER TABLE `Marker` ADD COLUMN `simpleStorageId` VARCHAR(191) NULL,
    MODIFY `gridId` VARCHAR(191) NULL,
    MODIFY `columnNumber` INTEGER NULL,
    MODIFY `rowNumber` INTEGER NULL;

-- CreateTable
CREATE TABLE `SimpleStorage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SimpleStorage` ADD CONSTRAINT `SimpleStorage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marker` ADD CONSTRAINT `Marker_gridId_fkey` FOREIGN KEY (`gridId`) REFERENCES `Grid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marker` ADD CONSTRAINT `Marker_simpleStorageId_fkey` FOREIGN KEY (`simpleStorageId`) REFERENCES `SimpleStorage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
