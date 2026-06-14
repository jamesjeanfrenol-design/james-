-- Script SQL pour ajouter la colonne unit_type à la table sale_items
-- À exécuter si la migration TypeORM n'a pas été appliquée

ALTER TABLE `sale_items` 
ADD COLUMN `unit_type` ENUM('SALE', 'PURCHASE') NULL DEFAULT 'SALE' AFTER `discount`;

