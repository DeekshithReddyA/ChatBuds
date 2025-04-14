/*
  Warnings:

  - You are about to drop the column `roomId` on the `Room` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Room_roomId_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "roomId";
