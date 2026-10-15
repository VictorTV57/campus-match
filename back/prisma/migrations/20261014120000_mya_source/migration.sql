-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_University" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "myaId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "gpaMin" REAL,
    "spots" INTEGER NOT NULL,
    "doubleDiploma" BOOLEAN NOT NULL,
    "erasmus" BOOLEAN NOT NULL,
    "semester" TEXT NOT NULL,
    "extraChargeEur" INTEGER NOT NULL,
    "specializations" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "administrative" TEXT NOT NULL,
    "accommodation" TEXT NOT NULL,
    "courses" TEXT NOT NULL,
    "cost" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sourceUpdatedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME NOT NULL
);
INSERT INTO "new_University" ("country", "id", "name", "specializations") SELECT "country", "id", "name", "specializations" FROM "University";
DROP TABLE "University";
ALTER TABLE "new_University" RENAME TO "University";
CREATE UNIQUE INDEX "University_myaId_key" ON "University"("myaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

