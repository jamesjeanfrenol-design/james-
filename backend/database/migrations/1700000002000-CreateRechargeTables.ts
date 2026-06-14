import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRechargeTables1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table recharge_types
    await queryRunner.createTable(
      new Table({
        name: 'recharge_types',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Table recharge_stocks
    await queryRunner.createTable(
      new Table({
        name: 'recharge_stocks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'recharge_type_id',
            type: 'int',
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'lastUpdated',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Table recharge_sales
    await queryRunner.createTable(
      new Table({
        name: 'recharge_sales',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'recharge_type_id',
            type: 'int',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'timestamp',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'recharge_stocks',
      new TableForeignKey({
        columnNames: ['recharge_type_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'recharge_types',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'recharge_sales',
      new TableForeignKey({
        columnNames: ['recharge_type_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'recharge_types',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'recharge_sales',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'recharge_sales',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Indexes
    await queryRunner.createIndex(
      'recharge_stocks',
      new TableIndex({
        name: 'IDX_recharge_stocks_type',
        columnNames: ['recharge_type_id'],
      })
    );

    await queryRunner.createIndex(
      'recharge_sales',
      new TableIndex({
        name: 'IDX_recharge_sales_type',
        columnNames: ['recharge_type_id'],
      })
    );

    await queryRunner.createIndex(
      'recharge_sales',
      new TableIndex({
        name: 'IDX_recharge_sales_timestamp',
        columnNames: ['timestamp'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recharge_sales');
    await queryRunner.dropTable('recharge_stocks');
    await queryRunner.dropTable('recharge_types');
  }
}

