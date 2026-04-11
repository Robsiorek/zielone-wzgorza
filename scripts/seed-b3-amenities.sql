-- B3 Seed: 58 amenities in 6 categories
-- Run on VPS: psql -U zwadmin -d zielone_wzgorza_admin -f scripts/seed-b3-amenities.sql
--
-- Safe idempotent: uses INSERT ON CONFLICT DO UPDATE (upsert) for categories
-- to always get the real ID back via RETURNING, then references it for amenities.
-- Re-runnable on any environment.

DO $$
DECLARE
  pid TEXT;
  cat_room TEXT;
  cat_kitchen TEXT;
  cat_media TEXT;
  cat_bathroom TEXT;
  cat_outdoor TEXT;
  cat_services TEXT;
  now_ts TIMESTAMP := NOW();
BEGIN
  SELECT id INTO pid FROM "properties" LIMIT 1;
  IF pid IS NULL THEN
    RAISE EXCEPTION 'No property found in database';
  END IF;

  -- Categories: upsert returns real ID regardless of prior state
  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Wyposażenie pokoju', 'wyposazenie-pokoju', 'bed-double', 0, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_room;

  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Kuchnia', 'kuchnia', 'cooking-pot', 1, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_kitchen;

  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Media i technologia', 'media-i-technologia', 'wifi', 2, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_media;

  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Łazienka', 'lazienka', 'bath', 3, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_bathroom;

  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Na zewnątrz i widok', 'na-zewnatrz-i-widok', 'trees', 4, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_outdoor;

  INSERT INTO "amenity_categories" (id, "propertyId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, pid, 'Usługi i udogodnienia', 'uslugi-i-udogodnienia', 'concierge-bell', 5, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts
  RETURNING id INTO cat_services;

  RAISE NOTICE 'Categories: room=%, kitchen=%, media=%, bath=%, outdoor=%, services=%',
    cat_room, cat_kitchen, cat_media, cat_bathroom, cat_outdoor, cat_services;

  -- ROOM FEATURES (12)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_room, 'Klimatyzacja',              'klimatyzacja',              'snowflake',          0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Ogrzewanie',                'ogrzewanie',                'thermometer-sun',    1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Kominek',                   'kominek',                   'flame',              2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Sofa rozkładana',           'sofa-rozkladana',           'sofa',               3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Szafa / Garderoba',         'szafa-garderoba',           'archive',            4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Biurko',                    'biurko',                    'lamp-desk',          5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Balkon / Taras',            'balkon-taras',              'door-open',          6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Sejf',                      'sejf',                      'lock',               7, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Żaluzje / Rolety',         'zaluzje-rolety',            'blinds',             8, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Łóżeczko dziecięce',       'lozeczko-dzieciece',        'baby',               9, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Dostęp dla niepełnosprawn.','dostep-niepelnosprawnych',  'accessibility',     10, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_room, 'Wentylator',                'wentylator',                'fan',               11, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  -- KITCHEN (10)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_kitchen, 'Aneks kuchenny',      'aneks-kuchenny',      'cooking-pot',      0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Lodówka',             'lodowka',             'refrigerator',     1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Mikrofalówka',        'mikrofalowka',        'microwave',        2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Czajnik elektryczny', 'czajnik-elektryczny', 'cup-soda',     3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Ekspres do kawy',    'ekspres-do-kawy',     'coffee',           4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Toster',              'toster',              'sandwich',         5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Naczynia i sztućce', 'naczynia-i-sztucce',  'utensils',         6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Zmywarka',            'zmywarka',            'sparkles',         7, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Grill',               'grill',               'flame-kindling',   8, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_kitchen, 'Jadalnia',            'jadalnia',            'utensils',         9, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  -- MEDIA & TECH (8)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_media, 'Wi-Fi',                 'wi-fi',               'wifi',             0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Telewizor',             'telewizor',           'tv',               1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Radio',                 'radio',               'radio',            2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Głośnik Bluetooth',     'glosnik-bluetooth',   'speaker',          3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Gniazdko USB',          'gniazdko-usb',        'plug-zap',         4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Konsola do gier',       'konsola-do-gier',     'gamepad-2',        5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Projektor',             'projektor',           'projector',        6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_media, 'Telefon',               'telefon',             'phone',            7, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  -- BATHROOM (8)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_bathroom, 'Prysznic',           'prysznic',            'shower-head',      0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Wanna',              'wanna',               'bath',             1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Suszarka do włosów', 'suszarka-do-wlosow',  'wind',             2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Ręczniki',           'reczniki',            'shirt',            3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Kosmetyki',          'kosmetyki',           'pipette',          4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Pralka',             'pralka',              'washing-machine',  5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Jacuzzi',            'jacuzzi',             'waves',            6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_bathroom, 'Bidet',              'bidet',               'droplets',         7, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  -- OUTDOOR & VIEW (10)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_outdoor, 'Ogród',               'ogrod',               'flower-2',         0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Taras z meblami',     'taras-z-meblami',     'armchair',         1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Widok na jezioro',    'widok-na-jezioro',    'eye',              2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Widok na las',        'widok-na-las',        'trees',            3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Plac zabaw',          'plac-zabaw',          'baby',             4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Miejsce na ognisko',  'miejsce-na-ognisko',  'flame',            5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Pomost / Plaża',      'pomost-plaza',        'anchor',           6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Kajak / Rower wodny', 'kajak-rower-wodny',   'sailboat',         7, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Rowery',              'rowery',              'bike',             8, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_outdoor, 'Parking',             'parking',             'car',              9, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  -- SERVICES (10)
  INSERT INTO "amenities" (id, "propertyId", "categoryId", name, slug, "iconKey", position, "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, pid, cat_services, 'Recepcja',              'recepcja',              'concierge-bell',    0, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Sprzątanie codzienne',  'sprzatanie-codzienne',  'sparkles',          1, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Śniadanie w cenie',     'sniadanie-w-cenie',     'egg',               2, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Monitoring',            'monitoring',            'cctv',              3, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Zwierzęta dozwolone',   'zwierzeta-dozwolone',   'paw-print',         4, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Zakaz palenia',         'zakaz-palenia',         'cigarette-off',     5, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Apteczka',              'apteczka',              'shield-check',         6, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Gaśnica',               'gasnica',               'fire-extinguisher', 7, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Płatność kartą',        'platnosc-karta',        'credit-card',       8, true, now_ts, now_ts),
    (gen_random_uuid()::text, pid, cat_services, 'Ekspresowy wymeldow.',   'ekspresowy-wymeldowanie','clock',            9, true, now_ts, now_ts)
  ON CONFLICT ("propertyId", slug) DO UPDATE SET "updatedAt" = now_ts;

  RAISE NOTICE 'B3 seed complete: 6 categories, 58 amenities for property %', pid;
END $$;
