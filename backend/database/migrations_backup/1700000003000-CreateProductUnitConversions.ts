import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductUnitConversions1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table product_unit_conversions
    await queryRunner.createTable(
      new Table({
        name: 'product_unit_conversions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'product_id',
            type: 'int',
          },
          {
            name: 'unit_id',
            type: 'int',
          },
          {
            name: 'conversion_ratio',
            type: 'decimal',
            precision: 10,
            scale: 6,
          },
          {
            name: 'custom_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'tinyint',
            default: 0,
          },
        ],
      }),
      true
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'product_unit_conversions',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'product_unit_conversions',
      new TableForeignKey({
        columnNames: ['unit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'units',
        onDelete: 'CASCADE',
      })
    );

    // Indexes
    await queryRunner.createIndex(
      'product_unit_conversions',
      new TableIndex({
        name: 'IDX_product_unit_conversions_product',
        columnNames: ['product_id'],
      })
    );

    await queryRunner.createIndex(
      'product_unit_conversions',
      new TableIndex({
        name: 'IDX_product_unit_conversions_unit',
        columnNames: ['unit_id'],
      })
    );

    await queryRunner.createIndex(
      'product_unit_conversions',
      new TableIndex({
        name: 'IDX_product_unit_conversions_product_unit',
        columnNames: ['product_id', 'unit_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_unit_conversions');
  }
}

