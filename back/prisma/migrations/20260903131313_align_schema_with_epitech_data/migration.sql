/*
  Warnings:

  - You are about to drop the column `city` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `climate` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `costOfLiving` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `housingAvailable` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `languagesTaught` on the `University` table. All the data in the column will be lost.
  - Added the required column `epitechProgramId` to the `University` table without a default value. This is not possible if the table is not empty.
  - Added the required column `languagesOfInstruction` to the `University` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceCents` to the `University` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programCategory` to the `University` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specializations` to the `University` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "budgetMax" INTEGER NOT NULL,
    "countries" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "foodPref" TEXT,
    "socialPref" TEXT,
    "climatePref" TEXT,
    "studyField" TEXT,
    "housingType" TEXT,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Preferences" ("budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "socialPref", "studyField", "userId") SELECT "budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "socialPref", "studyField", "userId" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");
CREATE TABLE "new_SocialMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userOneId" TEXT NOT NULL,
    "userTwoId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "compatibilityScore" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "SocialMatch_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialMatch_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialMatch_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SocialMatch" ("compatibilityScore", "id", "status", "universityId", "userOneId", "userTwoId") SELECT "compatibilityScore", "id", "status", "universityId", "userOneId", "userTwoId" FROM "SocialMatch";
DROP TABLE "SocialMatch";
ALTER TABLE "new_SocialMatch" RENAME TO "SocialMatch";
CREATE TABLE "new_Swipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Swipe_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Swipe" ("action", "createdAt", "id", "universityId", "userId") SELECT "action", "createdAt", "id", "universityId", "userId" FROM "Swipe";
DROP TABLE "Swipe";
ALTER TABLE "new_Swipe" RENAME TO "Swipe";
CREATE UNIQUE INDEX "Swipe_userId_universityId_key" ON "Swipe"("userId", "universityId");
CREATE TABLE "new_University" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epitechProgramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "programCategory" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "durationMonths" REAL,
    "availableSpots" INTEGER,
    "dualDegree" BOOLEAN,
    "gpaRequirement" REAL,
    "languageTestRequired" BOOLEAN,
    "languagesOfInstruction" TEXT NOT NULL,
    "specializations" TEXT NOT NULL,
    "isNewProgram" BOOLEAN NOT NULL DEFAULT false,
    "dataIncomplete" BOOLEAN NOT NULL DEFAULT false,
    "datesUncertain" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_University" ("country", "id", "name") SELECT "country", "id", "name" FROM "University";
DROP TABLE "University";
ALTER TABLE "new_University" RENAME TO "University";
CREATE UNIQUE INDEX "University_epitechProgramId_key" ON "University"("epitechProgramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
