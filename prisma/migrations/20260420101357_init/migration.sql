-- CreateTable
CREATE TABLE "Showroom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VERKOPER',
    "showroomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleNumber" TEXT NOT NULL,
    "articleName" TEXT NOT NULL,
    "supplierNameAnonymized" TEXT NOT NULL,
    "supplierNameReal" TEXT NOT NULL,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "sellingPrice" REAL NOT NULL DEFAULT 0,
    "grossMargin" REAL NOT NULL DEFAULT 0,
    "priorityScore" REAL NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisplayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showroomId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "numStroken" INTEGER NOT NULL DEFAULT 0,
    "numWandborden" INTEGER NOT NULL DEFAULT 0,
    "numBokken" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DisplayConfig_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DisplayConfig_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanogramItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showroomId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "displayType" TEXT NOT NULL,
    "bokNumber" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanogramItem_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanogramItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShowFloor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showroomId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "areaSqm" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShowFloor_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShowFloor_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showroomId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "revenue" REAL NOT NULL,
    CONSTRAINT "SalesData_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesData_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_articleNumber_key" ON "Article"("articleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayConfig_showroomId_categoryId_key" ON "DisplayConfig"("showroomId", "categoryId");
