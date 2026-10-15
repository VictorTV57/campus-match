-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "budgetMax" INTEGER,
    "countries" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "studyFields" TEXT NOT NULL DEFAULT '[]',
    "userGpa" REAL,
    "semesterPref" TEXT,
    "wantsDoubleDiploma" BOOLEAN NOT NULL DEFAULT false,
    "strictMode" BOOLEAN NOT NULL DEFAULT false,
    "foodPref" TEXT,
    "socialPref" TEXT,
    "climatePref" TEXT,
    "housingType" TEXT,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Preferences" ("budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "semesterPref", "socialPref", "strictMode", "studyFields", "userGpa", "userId") SELECT "budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "semesterPref", "socialPref", "strictMode", "studyFields", "userGpa", "userId" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

