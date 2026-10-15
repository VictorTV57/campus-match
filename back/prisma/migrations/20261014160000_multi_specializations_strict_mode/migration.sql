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
    "strictMode" BOOLEAN NOT NULL DEFAULT false,
    "foodPref" TEXT,
    "socialPref" TEXT,
    "climatePref" TEXT,
    "housingType" TEXT,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- studyField (une valeur) devient studyFields (tableau JSON) ; strictMode prend son défaut (false)
INSERT INTO "new_Preferences" ("budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "semesterPref", "socialPref", "userGpa", "userId", "studyFields") SELECT "budgetMax", "climatePref", "countries", "foodPref", "housingType", "id", "languages", "semesterPref", "socialPref", "userGpa", "userId", CASE WHEN "studyField" IS NULL OR trim("studyField") = '' THEN '[]' ELSE json_array("studyField") END FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

