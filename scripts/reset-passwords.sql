-- Reset / aanmaak alle showroom-users + HQ. Wachtwoord = "Lab21" (bcrypt hash hieronder).
-- Plak dit in Supabase Dashboard → SQL Editor → Run.

-- 1. Zorg dat alle showrooms bestaan
INSERT INTO "Showroom" (id, name, location, "createdAt") VALUES
  ('showroom-amersfoort',  'Amersfoort',  'Amersfoort',                NOW()),
  ('showroom-amsterdam',   'Amsterdam',   'Amsterdam',                 NOW()),
  ('showroom-oostzaan',    'Oostzaan',    'Oostzaan',                  NOW()),
  ('showroom-utrecht',     'Utrecht',     'Utrecht',                   NOW()),
  ('showroom-leiden',      'Leiden',      'Leiden',                    NOW()),
  ('showroom-delft',       'Delft',       'Delft',                     NOW()),
  ('showroom-capelle',     'Capelle',     'Capelle aan den IJssel',    NOW()),
  ('showroom-breda',       'Breda',       'Breda',                     NOW()),
  ('showroom-tilburg',     'Tilburg',     'Tilburg',                   NOW()),
  ('showroom-eindhoven',   'Eindhoven',   'Eindhoven',                 NOW()),
  ('showroom-denbosch',    'Den Bosch',   '''s-Hertogenbosch',         NOW()),
  ('showroom-enschede',    'Enschede',    'Enschede',                  NOW()),
  ('showroom-leeuwarden',  'Leeuwarden',  'Leeuwarden',                NOW()),
  ('showroom-groningen',   'Groningen',   'Groningen',                 NOW()),
  ('showroom-veenendaal',  'Veenendaal',  'Veenendaal',                NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location;

-- 2. Maak ontbrekende VERKOPER-users aan (één per showroom)
INSERT INTO "User" (id, name, email, password, role, "showroomId", "createdAt") VALUES
  (gen_random_uuid()::text, 'Amersfoort Showroom',  'amersfoort@lab21.nl',  '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-amersfoort',  NOW()),
  (gen_random_uuid()::text, 'Amsterdam Showroom',   'amsterdam@lab21.nl',   '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-amsterdam',   NOW()),
  (gen_random_uuid()::text, 'Oostzaan Showroom',    'oostzaan@lab21.nl',    '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-oostzaan',    NOW()),
  (gen_random_uuid()::text, 'Utrecht Showroom',     'utrecht@lab21.nl',     '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-utrecht',     NOW()),
  (gen_random_uuid()::text, 'Leiden Showroom',      'leiden@lab21.nl',      '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-leiden',      NOW()),
  (gen_random_uuid()::text, 'Delft Showroom',       'delft@lab21.nl',       '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-delft',       NOW()),
  (gen_random_uuid()::text, 'Capelle Showroom',     'capelle@lab21.nl',     '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-capelle',     NOW()),
  (gen_random_uuid()::text, 'Breda Showroom',       'breda@lab21.nl',       '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-breda',       NOW()),
  (gen_random_uuid()::text, 'Tilburg Showroom',     'tilburg@lab21.nl',     '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-tilburg',     NOW()),
  (gen_random_uuid()::text, 'Eindhoven Showroom',   'eindhoven@lab21.nl',   '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-eindhoven',   NOW()),
  (gen_random_uuid()::text, 'Den Bosch Showroom',   'denbosch@lab21.nl',    '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-denbosch',    NOW()),
  (gen_random_uuid()::text, 'Enschede Showroom',    'enschede@lab21.nl',    '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-enschede',    NOW()),
  (gen_random_uuid()::text, 'Leeuwarden Showroom',  'leeuwarden@lab21.nl',  '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-leeuwarden',  NOW()),
  (gen_random_uuid()::text, 'Groningen Showroom',   'groningen@lab21.nl',   '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-groningen',   NOW()),
  (gen_random_uuid()::text, 'Veenendaal Showroom',  'veenendaal@lab21.nl',  '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'VERKOPER', 'showroom-veenendaal',  NOW()),
  (gen_random_uuid()::text, 'Hoofdkantoor Beheer',  'hq@lab21.nl',          '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG', 'HOOFDKANTOOR', NULL,                  NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Reset ALLE wachtwoorden hard naar "Lab21" (ook bestaande accounts)
UPDATE "User" SET password = '$2b$10$62usw2kF39KAfMxrvWd69uFrrOssSnEI6L2c8faGoKuOYaqtmyQYG';

-- 4. Verificatie
SELECT email, role, "showroomId" FROM "User" ORDER BY role DESC, email;
