import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeQuantityToDecimal1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Modifier la colonne quantity dans sale_items pour accepter les décimales
    await queryRunner.query(`
      ALTER TABLE \`sale_items\` 
      MODIFY COLUMN \`quantity\` DECIMAL(10, 4) NOT NULL
    `);

    // Modifier la colonne quantity dans stock_movements pour accepter les décimales
    await queryRunner.query(`
      ALTER TABLE \`stock_movements\` 
      MODIFY COLUMN \`quantity\` DECIMAL(10, 4) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revenir aux entiers (attention: peut causer une perte de données si des décimales existent)
    await queryRunner.query(`
      ALTER TABLE \`sale_items\` 
      MODIFY COLUMN \`quantity\` INT NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`stock_movements\` 
      MODIFY COLUMN \`quantity\` INT NOT NULL
    `);
  }
}

