import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddSaleUnitIdToSaleItems1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne sale_unit_id
    await queryRunner.query(`
      ALTER TABLE \`sale_items\` 
      ADD COLUMN \`sale_unit_id\` INT NULL AFTER \`unit_type\`
    `);

    // Ajouter la clé étrangère
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['sale_unit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'units',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`sale_items\` DROP COLUMN \`sale_unit_id\``);
  }
}

