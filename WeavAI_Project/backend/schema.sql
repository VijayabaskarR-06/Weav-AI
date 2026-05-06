CREATE DATABASE IF NOT EXISTS weavai;
USE weavai;

CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120)        NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255)       NOT NULL,
  provider     ENUM('email','google') DEFAULT 'email',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS measurements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  gender       ENUM('male','female') NOT NULL DEFAULT 'female',
  bust         DECIMAL(5,2) NOT NULL,
  waist        DECIMAL(5,2) NOT NULL,
  hips         DECIMAL(5,2) NOT NULL,
  height       DECIMAL(5,2),
  weight       DECIMAL(5,2),
  age          INT,
  body_type    VARCHAR(50),
  unit         VARCHAR(10) DEFAULT 'cm',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brands (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) UNIQUE NOT NULL,
  logo      VARCHAR(10),
  site_url  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  slug  VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  gender ENUM('male','female','unisex') NOT NULL DEFAULT 'unisex'
);

CREATE TABLE IF NOT EXISTS size_charts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT NOT NULL,
  gender      ENUM('male','female') NOT NULL DEFAULT 'female',
  size_label  VARCHAR(10) NOT NULL,
  bust_min    DECIMAL(5,2), bust_max  DECIMAL(5,2),
  waist_min   DECIMAL(5,2), waist_max DECIMAL(5,2),
  hips_min    DECIMAL(5,2), hips_max  DECIMAL(5,2),
  category    VARCHAR(50) DEFAULT 'tops',
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brand_category_links (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT NOT NULL,
  category_id INT NOT NULL,
  gender      ENUM('male','female') NOT NULL DEFAULT 'female',
  shop_url    VARCHAR(500) NOT NULL,
  FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_brand_cat_gender (brand_id, category_id, gender)
);

CREATE TABLE IF NOT EXISTS feedback (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  brand_id        INT,
  category_id     INT,
  recommended_size VARCHAR(10),
  actual_fit      ENUM('perfect','too_small','too_large','slightly_small','slightly_large'),
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Migrations for existing installations (safe no-ops if already present on MySQL 8.0.16+)
-- If your MySQL is older, run these manually instead:
--   ALTER TABLE measurements        ADD COLUMN gender ENUM('male','female') NOT NULL DEFAULT 'female' AFTER user_id;
--   ALTER TABLE size_charts         ADD COLUMN gender ENUM('male','female') NOT NULL DEFAULT 'female' AFTER brand_id;
--   ALTER TABLE brand_category_links ADD COLUMN gender ENUM('male','female') NOT NULL DEFAULT 'female';

-- ─────────────── Seed: Categories ───────────────
INSERT IGNORE INTO categories (slug, label, gender) VALUES
  ('tops',         'Tops',         'unisex'),
  ('bottoms',      'Bottoms',      'unisex'),
  ('hoodies',      'Hoodies',      'unisex'),
  ('dresses',      'Dresses',      'female'),
  ('sports_bras',  'Sports Bras',  'female'),
  ('shirts',       'Shirts',       'male'),
  ('jackets',      'Jackets',      'unisex');

-- ─────────────── Seed: Brands (India) ───────────────
INSERT IGNORE INTO brands (name, logo, site_url) VALUES
  ('Nike',     'NK', 'https://www.nike.com/in/'),
  ('Adidas',   'AD', 'https://www.adidas.co.in/'),
  ('Puma',     'PM', 'https://in.puma.com/in/en'),
  ('H&M',      'HM', 'https://www2.hm.com/en_in/index.html'),
  ('Zara',     'ZA', 'https://www.zara.com/in/'),
  ('Levi\'s',  'LV', 'https://www.levi.in/'),
  ('Myntra',   'MY', 'https://www.myntra.com/'),
  ('AJIO',     'AJ', 'https://www.ajio.com/');

-- ─────────────── Seed: Women's size charts ───────────────
INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 79,84,  61,66,  86,91,  'tops', 1 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'female', 'S',  84,89,  66,71,  91,96,  'tops', 2 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'female', 'M',  89,94,  71,76,  96,101, 'tops', 3 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'female', 'L',  94,100, 76,82,  101,107,'tops', 4 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'female', 'XL', 100,107,82,89,  107,114,'tops', 5 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'female', 'XXL',107,114,89,96,  114,121,'tops', 6 FROM brands WHERE name='Nike';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 76,82,  58,63,  83,89,  'tops', 1 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'female', 'S',  82,88,  63,68,  89,95,  'tops', 2 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'female', 'M',  88,94,  68,74,  95,101, 'tops', 3 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'female', 'L',  94,101, 74,81,  101,108,'tops', 4 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'female', 'XL', 101,108,81,88,  108,115,'tops', 5 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'female', 'XXL',108,116,88,96,  115,123,'tops', 6 FROM brands WHERE name='Adidas';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 80,84, 61,65, 87,91,  'tops', 1 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'female', 'S',  84,88, 65,69, 91,95,  'tops', 2 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'female', 'M',  88,93, 69,74, 95,100, 'tops', 3 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'female', 'L',  93,99, 74,80, 100,106,'tops', 4 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'female', 'XL', 99,105,80,87, 106,113,'tops', 5 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'female', 'XXL',105,113,87,95,113,121,'tops', 6 FROM brands WHERE name='Puma';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 78,82,  60,64,  85,89,  'tops', 1 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'female', 'S',  82,87,  64,69,  89,94,  'tops', 2 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'female', 'M',  87,92,  69,74,  94,99,  'tops', 3 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'female', 'L',  92,98,  74,80,  99,105, 'tops', 4 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'female', 'XL', 98,105, 80,87,  105,112,'tops', 5 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'female', 'XXL',105,113,87,95,  112,120,'tops', 6 FROM brands WHERE name='H&M';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 78,82,  60,64,  86,90,  'tops', 1 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'female', 'S',  82,86,  64,68,  90,94,  'tops', 2 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'female', 'M',  86,91,  68,73,  94,99,  'tops', 3 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'female', 'L',  91,97,  73,79,  99,105, 'tops', 4 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'female', 'XL', 97,104, 79,86,  105,112,'tops', 5 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'female', 'XXL',104,112,86,94,  112,120,'tops', 6 FROM brands WHERE name='Zara';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 80,84,  62,66,  87,91,  'tops', 1 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'female', 'S',  84,89,  66,71,  91,96,  'tops', 2 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'female', 'M',  89,94,  71,76,  96,101, 'tops', 3 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'female', 'L',  94,100, 76,82,  101,107,'tops', 4 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'female', 'XL', 100,107,82,89,  107,114,'tops', 5 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'female', 'XXL',107,114,89,96,  114,121,'tops', 6 FROM brands WHERE name="Levi's";

-- Myntra & AJIO use a generic Indian-standard women's chart
INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'female', 'XS', 78,82,  60,64,  86,90,  'tops', 1 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'female', 'S',  82,87,  64,69,  90,95,  'tops', 2 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'female', 'M',  87,92,  69,74,  95,100, 'tops', 3 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'female', 'L',  92,98,  74,81,  100,107,'tops', 4 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'female', 'XL', 98,105, 81,88,  107,114,'tops', 5 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'female', 'XXL',105,114,88,96,  114,122,'tops', 6 FROM brands WHERE name IN ('Myntra','AJIO');

-- ─────────────── Seed: Men's size charts ───────────────
-- Standard Indian men's chart (chest/waist/hips in cm)
INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'male', 'M',  94,99,  81,86,  96,101,  'tops', 3 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'male', 'L',  99,104, 86,91,  101,106, 'tops', 4 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'male', 'XL', 104,110,91,97,  106,112, 'tops', 5 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'male', 'XXL',110,117,97,104, 112,119, 'tops', 6 FROM brands WHERE name='Nike';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'male', 'M',  94,99,  81,86,  96,101,  'tops', 3 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'male', 'L',  99,104, 86,91,  101,106, 'tops', 4 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'male', 'XL', 104,110,91,97,  106,112, 'tops', 5 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'male', 'XXL',110,117,97,104, 112,119, 'tops', 6 FROM brands WHERE name='Adidas';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 83,88,  70,75,  86,91,   'tops', 1 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'male', 'S',  88,93,  75,80,  91,96,   'tops', 2 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'male', 'M',  93,98,  80,85,  96,101,  'tops', 3 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'male', 'L',  98,103, 85,90,  101,106, 'tops', 4 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'male', 'XL', 103,109,90,96,  106,112, 'tops', 5 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'male', 'XXL',109,116,96,103, 112,119, 'tops', 6 FROM brands WHERE name='Puma';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'male', 'M',  94,100, 81,87,  96,102,  'tops', 3 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'male', 'L',  100,106,87,93,  102,108, 'tops', 4 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'male', 'XL', 106,112,93,100, 108,115, 'tops', 5 FROM brands WHERE name='H&M' UNION ALL
SELECT id, 'male', 'XXL',112,120,100,108,115,123, 'tops', 6 FROM brands WHERE name='H&M';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'male', 'M',  94,99,  81,86,  96,101,  'tops', 3 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'male', 'L',  99,104, 86,91,  101,106, 'tops', 4 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'male', 'XL', 104,110,91,97,  106,112, 'tops', 5 FROM brands WHERE name='Zara' UNION ALL
SELECT id, 'male', 'XXL',110,117,97,104, 112,119, 'tops', 6 FROM brands WHERE name='Zara';

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'male', 'M',  94,99,  81,86,  96,101,  'tops', 3 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'male', 'L',  99,104, 86,91,  101,106, 'tops', 4 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'male', 'XL', 104,110,91,97,  106,112, 'tops', 5 FROM brands WHERE name="Levi's" UNION ALL
SELECT id, 'male', 'XXL',110,117,97,104, 112,119, 'tops', 6 FROM brands WHERE name="Levi's";

INSERT INTO size_charts (brand_id, gender, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category, sort_order)
SELECT id, 'male', 'XS', 84,89,  71,76,  86,91,   'tops', 1 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'male', 'S',  89,94,  76,81,  91,96,   'tops', 2 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'male', 'M',  94,99,  81,86,  96,101,  'tops', 3 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'male', 'L',  99,104, 86,91,  101,106, 'tops', 4 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'male', 'XL', 104,110,91,97,  106,112, 'tops', 5 FROM brands WHERE name IN ('Myntra','AJIO') UNION ALL
SELECT id, 'male', 'XXL',110,117,97,104, 112,119, 'tops', 6 FROM brands WHERE name IN ('Myntra','AJIO');

-- ─────────────── Seed: Women's brand × category links (India) ───────────────
INSERT IGNORE INTO brand_category_links (brand_id, category_id, gender, shop_url)
SELECT b.id, c.id, 'female', v.url FROM brands b JOIN categories c
JOIN (
  SELECT 'Nike'    AS brand, 'tops'        AS slug, 'https://www.nike.com/in/w/womens-tops-tshirts-5e1x6Z9om13' AS url UNION ALL
  SELECT 'Nike',         'bottoms',      'https://www.nike.com/in/w/womens-trousers-tights-2kq19' UNION ALL
  SELECT 'Nike',         'dresses',      'https://www.nike.com/in/w/womens-skirts-dresses-5e1x6Z8y3qm' UNION ALL
  SELECT 'Nike',         'sports_bras',  'https://www.nike.com/in/w/womens-sports-bras-40qgk' UNION ALL
  SELECT 'Nike',         'hoodies',      'https://www.nike.com/in/w/womens-hoodies-pullovers-6rium' UNION ALL
  SELECT 'Adidas',       'tops',         'https://www.adidas.co.in/women-tops' UNION ALL
  SELECT 'Adidas',       'bottoms',      'https://www.adidas.co.in/women-bottoms' UNION ALL
  SELECT 'Adidas',       'sports_bras',  'https://www.adidas.co.in/women-sports_bras' UNION ALL
  SELECT 'Adidas',       'hoodies',      'https://www.adidas.co.in/women-hoodies' UNION ALL
  SELECT 'Puma',         'tops',         'https://in.puma.com/in/en/women/clothing/tops' UNION ALL
  SELECT 'Puma',         'bottoms',      'https://in.puma.com/in/en/women/clothing/bottoms' UNION ALL
  SELECT 'Puma',         'sports_bras',  'https://in.puma.com/in/en/women/clothing/sports-bras' UNION ALL
  SELECT 'Puma',         'hoodies',      'https://in.puma.com/in/en/women/clothing/hoodies-sweatshirts' UNION ALL
  SELECT 'H&M',          'tops',         'https://www2.hm.com/en_in/women/shop-by-product/tops.html' UNION ALL
  SELECT 'H&M',          'bottoms',      'https://www2.hm.com/en_in/women/shop-by-product/jeans.html' UNION ALL
  SELECT 'H&M',          'dresses',      'https://www2.hm.com/en_in/women/shop-by-product/dresses.html' UNION ALL
  SELECT 'H&M',          'hoodies',      'https://www2.hm.com/en_in/women/shop-by-product/hoodies-sweatshirts.html' UNION ALL
  SELECT 'Zara',         'tops',         'https://www.zara.com/in/en/woman-tshirts-l1362.html' UNION ALL
  SELECT 'Zara',         'bottoms',      'https://www.zara.com/in/en/woman-trousers-l1335.html' UNION ALL
  SELECT 'Zara',         'dresses',      'https://www.zara.com/in/en/woman-dresses-l1066.html' UNION ALL
  SELECT 'Levi\'s',      'tops',         'https://www.levi.in/women/tops/c/women_topwear' UNION ALL
  SELECT 'Levi\'s',      'bottoms',      'https://www.levi.in/women/jeans/c/women_jeans' UNION ALL
  SELECT 'Myntra',       'tops',         'https://www.myntra.com/women-tshirts' UNION ALL
  SELECT 'Myntra',       'bottoms',      'https://www.myntra.com/women-jeans' UNION ALL
  SELECT 'Myntra',       'dresses',      'https://www.myntra.com/women-dresses' UNION ALL
  SELECT 'Myntra',       'sports_bras',  'https://www.myntra.com/women-sports-bra' UNION ALL
  SELECT 'Myntra',       'hoodies',      'https://www.myntra.com/women-hoodies' UNION ALL
  SELECT 'AJIO',         'tops',         'https://www.ajio.com/shop/women-tshirts' UNION ALL
  SELECT 'AJIO',         'bottoms',      'https://www.ajio.com/shop/women-jeans' UNION ALL
  SELECT 'AJIO',         'dresses',      'https://www.ajio.com/shop/women-dresses' UNION ALL
  SELECT 'AJIO',         'sports_bras',  'https://www.ajio.com/shop/women-sportsbra' UNION ALL
  SELECT 'AJIO',         'hoodies',      'https://www.ajio.com/shop/women-hoodies'
) AS v ON b.name=v.brand AND c.slug=v.slug;

-- ─────────────── Seed: Men's brand × category links (India) ───────────────
INSERT IGNORE INTO brand_category_links (brand_id, category_id, gender, shop_url)
SELECT b.id, c.id, 'male', v.url FROM brands b JOIN categories c
JOIN (
  SELECT 'Nike'    AS brand, 'tops'    AS slug, 'https://www.nike.com/in/w/mens-tops-tshirts-9om13' AS url UNION ALL
  SELECT 'Nike',         'bottoms',  'https://www.nike.com/in/w/mens-trousers-tights-2kq19' UNION ALL
  SELECT 'Nike',         'hoodies',  'https://www.nike.com/in/w/mens-hoodies-pullovers-6rium' UNION ALL
  SELECT 'Adidas',       'tops',     'https://www.adidas.co.in/men-tops' UNION ALL
  SELECT 'Adidas',       'bottoms',  'https://www.adidas.co.in/men-trousers-pants' UNION ALL
  SELECT 'Adidas',       'hoodies',  'https://www.adidas.co.in/men-hoodies' UNION ALL
  SELECT 'Puma',         'tops',     'https://in.puma.com/in/en/men/clothing/tops' UNION ALL
  SELECT 'Puma',         'bottoms',  'https://in.puma.com/in/en/men/clothing/bottoms' UNION ALL
  SELECT 'Puma',         'hoodies',  'https://in.puma.com/in/en/men/clothing/hoodies-sweatshirts' UNION ALL
  SELECT 'H&M',          'tops',     'https://www2.hm.com/en_in/men/shop-by-product/tshirts-tank-tops.html' UNION ALL
  SELECT 'H&M',          'bottoms',  'https://www2.hm.com/en_in/men/shop-by-product/jeans.html' UNION ALL
  SELECT 'H&M',          'hoodies',  'https://www2.hm.com/en_in/men/shop-by-product/hoodies-sweatshirts.html' UNION ALL
  SELECT 'H&M',          'shirts',   'https://www2.hm.com/en_in/men/shop-by-product/shirts.html' UNION ALL
  SELECT 'Zara',         'tops',     'https://www.zara.com/in/en/man-tshirts-l855.html' UNION ALL
  SELECT 'Zara',         'bottoms',  'https://www.zara.com/in/en/man-jeans-l659.html' UNION ALL
  SELECT 'Zara',         'shirts',   'https://www.zara.com/in/en/man-shirts-l737.html' UNION ALL
  SELECT 'Levi\'s',      'tops',     'https://www.levi.in/men/topwear/c/men_topwear' UNION ALL
  SELECT 'Levi\'s',      'bottoms',  'https://www.levi.in/men/jeans/c/men_jeans' UNION ALL
  SELECT 'Levi\'s',      'shirts',   'https://www.levi.in/men/shirts/c/men_shirts' UNION ALL
  SELECT 'Myntra',       'tops',     'https://www.myntra.com/men-tshirts' UNION ALL
  SELECT 'Myntra',       'bottoms',  'https://www.myntra.com/men-jeans' UNION ALL
  SELECT 'Myntra',       'shirts',   'https://www.myntra.com/men-casual-shirts' UNION ALL
  SELECT 'Myntra',       'hoodies',  'https://www.myntra.com/men-sweatshirts' UNION ALL
  SELECT 'AJIO',         'tops',     'https://www.ajio.com/shop/men-tshirts' UNION ALL
  SELECT 'AJIO',         'bottoms',  'https://www.ajio.com/shop/men-jeans' UNION ALL
  SELECT 'AJIO',         'shirts',   'https://www.ajio.com/shop/men-casualshirts' UNION ALL
  SELECT 'AJIO',         'hoodies',  'https://www.ajio.com/shop/men-sweatshirts'
) AS v ON b.name=v.brand AND c.slug=v.slug;
