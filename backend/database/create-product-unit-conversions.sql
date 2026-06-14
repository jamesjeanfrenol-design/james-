-- Créer la table product_unit_conversions
CREATE TABLE IF NOT EXISTS `product_unit_conversions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `conversion_ratio` decimal(10,6) NOT NULL,
  `custom_price` decimal(10,2) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_product_unit_conversions_product_unit` (`product_id`, `unit_id`),
  KEY `IDX_product_unit_conversions_product` (`product_id`),
  KEY `IDX_product_unit_conversions_unit` (`unit_id`),
  CONSTRAINT `FK_product_unit_conversions_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_product_unit_conversions_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Ajouter la colonne sale_unit_id à sale_items si elle n'existe pas
ALTER TABLE `sale_items` 
ADD COLUMN IF NOT EXISTS `sale_unit_id` INT NULL AFTER `unit_type`;

-- Ajouter la clé étrangère pour sale_unit_id si elle n'existe pas
-- Note: MySQL ne supporte pas "IF NOT EXISTS" pour les contraintes, donc on vérifie d'abord
SET @dbname = DATABASE();
SET @tablename = "sale_items";
SET @columnname = "sale_unit_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD CONSTRAINT FK_sale_items_sale_unit FOREIGN KEY (sale_unit_id) REFERENCES units(id) ON DELETE SET NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Migrer les données existantes : créer les conversions pour tous les produits
-- Conversion pour l'unité principale (unit_id) avec ratio = 1, is_default = true
INSERT INTO `product_unit_conversions` (`product_id`, `unit_id`, `conversion_ratio`, `is_default`, `custom_price`)
SELECT `id`, `unit_id`, 1, 1, NULL
FROM `products`
WHERE NOT EXISTS (
  SELECT 1 FROM `product_unit_conversions` 
  WHERE `product_unit_conversions`.`product_id` = `products`.`id` 
  AND `product_unit_conversions`.`unit_id` = `products`.`unit_id`
);

-- Créer les conversions pour l'unité d'achat si différente de l'unité principale
INSERT INTO `product_unit_conversions` (`product_id`, `unit_id`, `conversion_ratio`, `is_default`, `custom_price`)
SELECT `id`, `purchase_unit_id`, `conversion_ratio`, 0, NULL
FROM `products`
WHERE `purchase_unit_id` != `unit_id`
AND `conversion_ratio` != 1
AND NOT EXISTS (
  SELECT 1 FROM `product_unit_conversions` 
  WHERE `product_unit_conversions`.`product_id` = `products`.`id` 
  AND `product_unit_conversions`.`unit_id` = `products`.`purchase_unit_id`
);

