import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitTypeToSaleItems1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Utiliser une requête SQL directe pour MySQL
    await queryRunner.query(`
      ALTER TABLE \`sale_items\` 
      ADD COLUMN \`unit_type\` ENUM('SALE', 'PURCHASE') NULL DEFAULT 'SALE' AFTER \`discount\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`sale_items\` DROP COLUMN \`unit_type\``);
  }
}

