-- ═══════════════════════════════════════════════════════
--  WEAV AI — Complete MySQL Database Schema
--  Run: mysql -u root -p < schema.sql
-- ═══════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS weavai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE weavai;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)        NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  provider      ENUM('email','google') DEFAULT 'email',
  photo_url     VARCHAR(500)        DEFAULT NULL,
  is_active     BOOLEAN             DEFAULT TRUE,
  created_at    DATETIME            DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS measurements (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  bust       DECIMAL(6,2) NOT NULL,
  waist      DECIMAL(6,2) NOT NULL,
  hips       DECIMAL(6,2) NOT NULL,
  height     DECIMAL(6,2),
  weight     DECIMAL(6,2),
  age        SMALLINT UNSIGNED,
  body_type  VARCHAR(50),
  unit       VARCHAR(10)  DEFAULT 'cm',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS brands (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) UNIQUE NOT NULL,
  logo     VARCHAR(10),
  country  VARCHAR(60),
  site_url VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(50) UNIQUE NOT NULL,
  label      VARCHAR(80) NOT NULL,
  icon       VARCHAR(10),
  sort_order TINYINT UNSIGNED DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brand_category_links (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  shop_url    VARCHAR(500) NOT NULL,
  UNIQUE KEY uq_bc (brand_id, category_id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS size_charts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id   INT UNSIGNED NOT NULL,
  size_label VARCHAR(10)  NOT NULL,
  bust_min   DECIMAL(6,2) NOT NULL,
  bust_max   DECIMAL(6,2) NOT NULL,
  waist_min  DECIMAL(6,2) NOT NULL,
  waist_max  DECIMAL(6,2) NOT NULL,
  hips_min   DECIMAL(6,2) NOT NULL,
  hips_max   DECIMAL(6,2) NOT NULL,
  sort_order TINYINT UNSIGNED DEFAULT 0,
  UNIQUE KEY uq_brand_size (brand_id, size_label),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendations (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  measurement_id   INT UNSIGNED NOT NULL,
  brand_id         INT UNSIGNED NOT NULL,
  category_id      INT UNSIGNED NOT NULL,
  recommended_size VARCHAR(10)  NOT NULL,
  confidence_pct   TINYINT UNSIGNED DEFAULT 80,
  shop_url         VARCHAR(500),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (measurement_id) REFERENCES measurements(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id)       REFERENCES brands(id)       ON DELETE CASCADE,
  FOREIGN KEY (category_id)    REFERENCES categories(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  brand_id         INT UNSIGNED,
  category_id      INT UNSIGNED,
  recommended_size VARCHAR(10),
  actual_fit       ENUM('perfect','slightly_small','too_small','slightly_large','too_large') NOT NULL,
  notes            TEXT,
  rating           TINYINT UNSIGNED,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (brand_id)    REFERENCES brands(id)      ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ═══════════════ SEED DATA ═══════════════

INSERT IGNORE INTO categories (slug,label,icon,sort_order) VALUES
('tops','Tops','✦',1),('bottoms','Bottoms','◆',2),('dresses','Dresses','◇',3),
('sports_bras','Sports Bras','○',4),('hoodies','Hoodies','▽',5),
('accessories','Accessories','❋',6),('outerwear','Outerwear','◈',7),('footwear','Footwear','◎',8);

INSERT IGNORE INTO brands (name,logo,country,site_url) VALUES
('Nike','NK','USA','https://www.nike.com/w/womens-clothing'),
('Adidas','AD','Germany','https://www.adidas.com/us/women-clothing'),
('Puma','PM','Germany','https://us.puma.com/us/en/women/clothing'),
('H&M','HM','Sweden','https://www2.hm.com/en_us/ladies'),
('Zara','ZA','Spain','https://www.zara.com/us/en/woman-clothing-l1066.html'),
("Levi's",'LV','USA','https://www.levi.com/US/en_US/clothing/women/c/levi_clothing_women');

-- Shop links (all 48 combinations)
INSERT IGNORE INTO brand_category_links (brand_id,category_id,shop_url)
SELECT b.id,c.id,u.url FROM brands b JOIN categories c JOIN (
  SELECT 'Nike' br,'tops' ca,'https://www.nike.com/w/womens-tops-shirts-5e1x6znik1' url UNION ALL
  SELECT 'Nike','bottoms','https://www.nike.com/w/womens-pants-tights-leggings-37v7jznik1' UNION ALL
  SELECT 'Nike','dresses','https://www.nike.com/w/womens-skirts-dresses-5e1x6znik1' UNION ALL
  SELECT 'Nike','sports_bras','https://www.nike.com/w/womens-sports-bras-znik1' UNION ALL
  SELECT 'Nike','hoodies','https://www.nike.com/w/womens-hoodies-sweatshirts-6rive' UNION ALL
  SELECT 'Nike','accessories','https://www.nike.com/w/womens-accessories-6nmx2' UNION ALL
  SELECT 'Nike','outerwear','https://www.nike.com/w/womens-jackets-vests-50r7y' UNION ALL
  SELECT 'Nike','footwear','https://www.nike.com/w/womens-shoes-5e1x6' UNION ALL
  SELECT 'Adidas','tops','https://www.adidas.com/us/women-tops' UNION ALL
  SELECT 'Adidas','bottoms','https://www.adidas.com/us/women-pants-tights' UNION ALL
  SELECT 'Adidas','dresses','https://www.adidas.com/us/women-dresses-skirts' UNION ALL
  SELECT 'Adidas','sports_bras','https://www.adidas.com/us/women-sports-bras' UNION ALL
  SELECT 'Adidas','hoodies','https://www.adidas.com/us/women-hoodies-sweatshirts' UNION ALL
  SELECT 'Adidas','accessories','https://www.adidas.com/us/women-accessories' UNION ALL
  SELECT 'Adidas','outerwear','https://www.adidas.com/us/women-jackets-vests' UNION ALL
  SELECT 'Adidas','footwear','https://www.adidas.com/us/women-shoes' UNION ALL
  SELECT 'Puma','tops','https://us.puma.com/us/en/women/clothing/tops' UNION ALL
  SELECT 'Puma','bottoms','https://us.puma.com/us/en/women/clothing/bottoms' UNION ALL
  SELECT 'Puma','dresses','https://us.puma.com/us/en/women/clothing/dresses' UNION ALL
  SELECT 'Puma','sports_bras','https://us.puma.com/us/en/women/clothing/sports-bras' UNION ALL
  SELECT 'Puma','hoodies','https://us.puma.com/us/en/women/clothing/hoodies-sweatshirts' UNION ALL
  SELECT 'Puma','accessories','https://us.puma.com/us/en/women/accessories' UNION ALL
  SELECT 'Puma','outerwear','https://us.puma.com/us/en/women/clothing/jackets' UNION ALL
  SELECT 'Puma','footwear','https://us.puma.com/us/en/women/shoes' UNION ALL
  SELECT 'H&M','tops','https://www2.hm.com/en_us/ladies/shop-by-product/tops.html' UNION ALL
  SELECT 'H&M','bottoms','https://www2.hm.com/en_us/ladies/shop-by-product/trousers.html' UNION ALL
  SELECT 'H&M','dresses','https://www2.hm.com/en_us/ladies/shop-by-product/dresses.html' UNION ALL
  SELECT 'H&M','sports_bras','https://www2.hm.com/en_us/ladies/shop-by-product/sport-bras.html' UNION ALL
  SELECT 'H&M','hoodies','https://www2.hm.com/en_us/ladies/shop-by-product/hoodies-sweatshirts.html' UNION ALL
  SELECT 'H&M','accessories','https://www2.hm.com/en_us/ladies/accessories.html' UNION ALL
  SELECT 'H&M','outerwear','https://www2.hm.com/en_us/ladies/shop-by-product/jackets-coats.html' UNION ALL
  SELECT 'H&M','footwear','https://www2.hm.com/en_us/ladies/shop-by-product/shoes.html' UNION ALL
  SELECT 'Zara','tops','https://www.zara.com/us/en/woman-tops-l1249.html' UNION ALL
  SELECT 'Zara','bottoms','https://www.zara.com/us/en/woman-trousers-l1335.html' UNION ALL
  SELECT 'Zara','dresses','https://www.zara.com/us/en/woman-dresses-l1066.html' UNION ALL
  SELECT 'Zara','sports_bras','https://www.zara.com/us/en/woman-sport-l1418.html' UNION ALL
  SELECT 'Zara','hoodies','https://www.zara.com/us/en/woman-sweatshirts-l1371.html' UNION ALL
  SELECT 'Zara','accessories','https://www.zara.com/us/en/woman-accessories-l1244.html' UNION ALL
  SELECT 'Zara','outerwear','https://www.zara.com/us/en/woman-outerwear-l1108.html' UNION ALL
  SELECT 'Zara','footwear','https://www.zara.com/us/en/woman-shoes-l1251.html' UNION ALL
  SELECT "Levi's",'tops','https://www.levi.com/US/en_US/clothing/women/tops/c/tops_women' UNION ALL
  SELECT "Levi's",'bottoms','https://www.levi.com/US/en_US/clothing/women/jeans/c/jeans_women' UNION ALL
  SELECT "Levi's",'dresses','https://www.levi.com/US/en_US/clothing/women/dresses/c/dresses_women' UNION ALL
  SELECT "Levi's",'sports_bras','https://www.levi.com/US/en_US/clothing/women/c/levi_clothing_women' UNION ALL
  SELECT "Levi's",'hoodies','https://www.levi.com/US/en_US/clothing/women/sweatshirts-hoodies/c/sweatshirts_women' UNION ALL
  SELECT "Levi's",'accessories','https://www.levi.com/US/en_US/accessories/women/c/levi_accessories_women' UNION ALL
  SELECT "Levi's",'outerwear','https://www.levi.com/US/en_US/clothing/women/jackets-and-coats/c/jackets_women' UNION ALL
  SELECT "Levi's",'footwear','https://www.levi.com/US/en_US/footwear/women/c/levi_footwear_women'
) u ON b.name=u.br AND c.slug=u.ca;

-- Size charts
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,79,84,61,66,86,91,1 o UNION ALL SELECT 'S',84,89,66,71,91,96,2 UNION ALL SELECT 'M',89,94,71,76,96,101,3 UNION ALL SELECT 'L',94,100,76,82,101,107,4 UNION ALL SELECT 'XL',100,107,82,89,107,114,5 UNION ALL SELECT 'XXL',107,114,89,96,114,121,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name='Nike';
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,76,82,58,63,83,89,1 o UNION ALL SELECT 'S',82,88,63,68,89,95,2 UNION ALL SELECT 'M',88,94,68,74,95,101,3 UNION ALL SELECT 'L',94,101,74,81,101,108,4 UNION ALL SELECT 'XL',101,108,81,88,108,115,5 UNION ALL SELECT 'XXL',108,116,88,96,115,123,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name='Adidas';
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,80,84,61,65,87,91,1 o UNION ALL SELECT 'S',84,88,65,69,91,95,2 UNION ALL SELECT 'M',88,93,69,74,95,100,3 UNION ALL SELECT 'L',93,99,74,80,100,106,4 UNION ALL SELECT 'XL',99,105,80,87,106,113,5 UNION ALL SELECT 'XXL',105,113,87,95,113,121,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name='Puma';
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,80,83,61,64,86,89,1 o UNION ALL SELECT 'S',83,87,64,68,89,93,2 UNION ALL SELECT 'M',87,93,68,74,93,99,3 UNION ALL SELECT 'L',93,99,74,80,99,105,4 UNION ALL SELECT 'XL',99,107,80,88,105,113,5 UNION ALL SELECT 'XXL',107,115,88,96,113,121,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name='H&M';
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,79,83,60,64,86,90,1 o UNION ALL SELECT 'S',83,87,64,68,90,94,2 UNION ALL SELECT 'M',87,93,68,74,94,100,3 UNION ALL SELECT 'L',93,99,74,80,100,106,4 UNION ALL SELECT 'XL',99,107,80,88,106,114,5 UNION ALL SELECT 'XXL',107,115,88,96,114,122,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name='Zara';
INSERT IGNORE INTO size_charts (brand_id,size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max,sort_order) SELECT b.id,s,bmin,bmax,wmin,wmax,hmin,hmax,o FROM brands b JOIN (SELECT 'XS' s,81,84,62,65,87,90,1 o UNION ALL SELECT 'S',84,88,65,69,90,94,2 UNION ALL SELECT 'M',88,94,69,75,94,100,3 UNION ALL SELECT 'L',94,100,75,81,100,106,4 UNION ALL SELECT 'XL',100,108,81,89,106,114,5 UNION ALL SELECT 'XXL',108,116,89,97,114,122,6) t(s,bmin,bmax,wmin,wmax,hmin,hmax,o) WHERE b.name="Levi's";

SELECT '✅ Database setup complete!' AS status;
SELECT COUNT(*) brands FROM brands;
SELECT COUNT(*) categories FROM categories;
SELECT COUNT(*) size_charts FROM size_charts;
SELECT COUNT(*) shop_links FROM brand_category_links;
