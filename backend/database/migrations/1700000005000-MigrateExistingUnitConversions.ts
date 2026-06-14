import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateExistingUnitConversions1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer les conversions pour tous les produits existants
    // Conversion pour l'unité principale (unit_id) avec ratio = 1, is_default = true
    await queryRunner.query(`
      INSERT INTO product_unit_conversions (product_id, unit_id, conversion_ratio, is_default, custom_price)
      SELECT id, unit_id, 1, 1, NULL
      FROM products
      WHERE NOT EXISTS (
        SELECT 1 FROM product_unit_conversions 
        WHERE product_unit_conversions.product_id = products.id 
        AND product_unit_conversions.unit_id = products.unit_id
      )
    `);

    // Créer les conversions pour l'unité d'achat si différente de l'unité principale
    await queryRunner.query(`
      INSERT INTO product_unit_conversions (product_id, unit_id, conversion_ratio, is_default, custom_price)
      SELECT id, purchase_unit_id, conversion_ratio, 0, NULL
      FROM products
      WHERE purchase_unit_id != unit_id
      AND conversion_ratio != 1
      AND NOT EXISTS (
        SELECT 1 FROM product_unit_conversions 
        WHERE product_unit_conversions.product_id = products.id 
        AND product_unit_conversions.unit_id = products.purchase_unit_id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer toutes les conversions créées par cette migration
    // (On garde celles créées manuellement)
    await queryRunner.query(`
      DELETE FROM product_unit_conversions 
      WHERE custom_price IS NULL
    `);
  }
}

