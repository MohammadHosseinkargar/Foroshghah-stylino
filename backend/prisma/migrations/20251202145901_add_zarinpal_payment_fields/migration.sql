/*
  Warnings:

  - A unique constraint covering the columns `[authority]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `authority` VARCHAR(191) NULL,
    ADD COLUMN `cardPan` VARCHAR(191) NULL,
    ADD COLUMN `fee` INTEGER NULL,
    ADD COLUMN `feeType` VARCHAR(191) NULL,
    ADD COLUMN `paymentAmount` INTEGER NULL,
    ADD COLUMN `paymentGateway` VARCHAR(191) NULL DEFAULT 'ZARINPAL',
    ADD COLUMN `paymentMessage` VARCHAR(191) NULL,
    ADD COLUMN `refId` BIGINT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_authority_key` ON `Order`(`authority`);
