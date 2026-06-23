-- Staff kitchen raw-ingredient inventory (separate from main inventory) + per-food recipes.

-- CreateTable
CREATE TABLE "StaffIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "minThreshold" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingSync" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "StaffRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffMenuItemId" TEXT NOT NULL,
    "staffIngredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "pendingSync" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StaffRecipe_staffMenuItemId_fkey" FOREIGN KEY ("staffMenuItemId") REFERENCES "StaffMenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffRecipe_staffIngredientId_fkey" FOREIGN KEY ("staffIngredientId") REFERENCES "StaffIngredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffRecipe_staffMenuItemId_staffIngredientId_key" ON "StaffRecipe"("staffMenuItemId", "staffIngredientId");
