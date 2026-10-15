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
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "SocialMatch_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialMatch_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialMatch_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "Swipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Swipe_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Swipe" ("action", "createdAt", "id", "universityId", "userId") SELECT "action", "createdAt", "id", "universityId", "userId" FROM "Swipe";
DROP TABLE "Swipe";
ALTER TABLE "new_Swipe" RENAME TO "Swipe";
CREATE UNIQUE INDEX "Swipe_userId_universityId_key" ON "Swipe"("userId", "universityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
