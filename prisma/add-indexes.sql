-- Performance indexes — voer uit op Supabase (SQL editor) of via prisma db push.
-- CONCURRENTLY = non-blocking. Haal uit als je dit binnen een transactie wilt draaien.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Article_categoryId_idx" ON "Article"("categoryId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Article_isActive_idx" ON "Article"("isActive");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlanogramItem_showroomId_idx" ON "PlanogramItem"("showroomId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlanogramItem_articleId_idx" ON "PlanogramItem"("articleId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlanogramItem_categoryId_idx" ON "PlanogramItem"("categoryId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlanogramItem_showroom_locatie_idx"
  ON "PlanogramItem"("showroomId", "locatieType", "locatieNummer", "positie");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ShowFloor_showroomId_idx" ON "ShowFloor"("showroomId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ShowFloor_articleId_idx" ON "ShowFloor"("articleId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Inventory_showroomId_idx" ON "Inventory"("showroomId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Inventory_articleId_idx" ON "Inventory"("articleId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Inventory_showroom_locatie_idx"
  ON "Inventory"("showroomId", "locatieType", "locatieNummer");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "SalesData_showroomId_idx" ON "SalesData"("showroomId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SalesData_articleId_idx" ON "SalesData"("articleId");
