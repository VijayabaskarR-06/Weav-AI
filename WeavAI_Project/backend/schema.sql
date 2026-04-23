-- ════════════════════════════════════════════════════
--  Weav AI — MySQL Database Schema
--  Run this file once to set up all tables
-- ════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS weavai;
USE weavai;

-- ── Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120)        NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255)        NOT NULL,    -- bcrypt hashed
  provider     ENUM('email','google') DEFAULT 'email',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Measurements ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS measurements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  bust         DECIMAL(5,2) NOT NULL,   -- cm
  waist        DECIMAL(5,2) NOT NULL,   -- cm
  hips         DECIMAL(5,2) NOT NULL,   -- cm
  height       DECIMAL(5,2),            -- cm
  weight       DECIMAL(5,2),            -- kg
  age          INT,
  body_type    VARCHAR(50),
  unit         VARCHAR(10) DEFAULT 'cm',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Brands ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) UNIQUE NOT NULL,
  logo      VARCHAR(10),
  site_url  VARCHAR(255)
);

-- ── Size Charts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS size_charts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT NOT NULL,
  size_label  VARCHAR(10) NOT NULL,
  bust_min    DECIMAL(5,2), bust_max  DECIMAL(5,2),
  waist_min   DECIMAL(5,2), waist_max DECIMAL(5,2),
  hips_min    DECIMAL(5,2), hips_max  DECIMAL(5,2),
  category    ENUM('tops','bottoms','dresses','sports_bras','hoodies') DEFAULT 'tops',
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- ── Category Links ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_category_links (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT NOT NULL,
  category    VARCHAR(50) NOT NULL,
  shop_url    VARCHAR(500) NOT NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- ── Feedback ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  brand           VARCHAR(100),
  category        VARCHAR(50),
  recommended_size VARCHAR(10),
  actual_fit      ENUM('perfect','too_small','too_large','slightly_small','slightly_large'),
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════════════
--  Seed Data — Brands & Size Charts
-- ════════════════════════════════════════════════════

INSERT IGNORE INTO brands (name, logo, site_url) VALUES
  ('Nike',   'NK', 'https://www.nike.com/w/womens-clothing'),
  ('Adidas', 'AD', 'https://www.adidas.com/us/women-clothing'),
  ('Puma',   'PM', 'https://us.puma.com/us/en/women/clothing'),
  ('H&M',    'HM', 'https://www2.hm.com/en_us/ladies'),
  ('Zara',   'ZA', 'https://www.zara.com/us/en/woman-clothing-l1066.html'),
  ('Levi\'s','LV', 'https://www.levi.com/US/en_US/clothing/women/c/levi_clothing_women');

-- Nike size chart (all categories share same chart)
INSERT INTO size_charts (brand_id, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category)
SELECT id, 'XS', 79,84,  61,66,  86,91  FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'S',  84,89,  66,71,  91,96  FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'M',  89,94,  71,76,  96,101 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'L',  94,100, 76,82,  101,107 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'XL', 100,107,82,89, 107,114 FROM brands WHERE name='Nike' UNION ALL
SELECT id, 'XXL',107,114,89,96, 114,121 FROM brands WHERE name='Nike';

INSERT INTO size_charts (brand_id, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category)
SELECT id, 'XS', 76,82,  58,63,  83,89  FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'S',  82,88,  63,68,  89,95  FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'M',  88,94,  68,74,  95,101 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'L',  94,101, 74,81,  101,108 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'XL', 101,108,81,88, 108,115 FROM brands WHERE name='Adidas' UNION ALL
SELECT id, 'XXL',108,116,88,96, 115,123 FROM brands WHERE name='Adidas';

INSERT INTO size_charts (brand_id, size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max, category)
SELECT id, 'XS', 80,84, 61,65, 87,91  FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'S',  84,88, 65,69, 91,95  FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'M',  88,93, 69,74, 95,100 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'L',  93,99, 74,80, 100,106 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'XL', 99,105,80,87, 106,113 FROM brands WHERE name='Puma' UNION ALL
SELECT id, 'XXL',105,113,87,95,113,121 FROM brands WHERE name='Puma';

-- Brand category shop links
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'tops','https://www.nike.com/w/womens-tops-shirts-5e1x6znik1' FROM brands WHERE name='Nike';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'bottoms','https://www.nike.com/w/womens-pants-tights-leggings-37v7jznik1' FROM brands WHERE name='Nike';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'dresses','https://www.nike.com/w/womens-skirts-dresses-5e1x6znik1' FROM brands WHERE name='Nike';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'tops','https://www.adidas.com/us/women-tops' FROM brands WHERE name='Adidas';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'bottoms','https://www.adidas.com/us/women-pants-tights' FROM brands WHERE name='Adidas';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'tops','https://us.puma.com/us/en/women/clothing/tops' FROM brands WHERE name='Puma';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'bottoms','https://us.puma.com/us/en/women/clothing/bottoms' FROM brands WHERE name='Puma';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'tops','https://www2.hm.com/en_us/ladies/shop-by-product/tops.html' FROM brands WHERE name='H&M';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'tops','https://www.zara.com/us/en/woman-tops-l1249.html' FROM brands WHERE name='Zara';
INSERT INTO brand_category_links (brand_id, category, shop_url) SELECT id,'bottoms','https://www.levi.com/US/en_US/clothing/women/jeans/c/jeans_women' FROM brands WHERE name="Levi's";
