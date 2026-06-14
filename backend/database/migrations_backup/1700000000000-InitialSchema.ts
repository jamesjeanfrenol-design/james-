import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Units table
    await queryRunner.createTable(
      new Table({
        name: 'units',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'short_name',
            type: 'varchar',
          },
        ],
      }),
      true
    );

    // Categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Warehouses table
    await queryRunner.createTable(
      new Table({
        name: 'warehouses',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'location',
            type: 'varchar',
          },
        ],
      }),
      true
    );

    // Suppliers table
    await queryRunner.createTable(
      new Table({
        name: 'suppliers',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'contact',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSEMAN'],
            default: "'CASHIER'",
          },
          {
            name: 'created_at',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    // Products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'sku',
            type: 'varchar',
          },
          {
            name: 'barcode',
            type: 'varchar',
          },
          {
            name: 'barcode2',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'wholesale_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'wholesale_threshold',
            type: 'int',
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'stock_magasin',
            type: 'int',
            default: 0,
          },
          {
            name: 'stock_principal',
            type: 'int',
            default: 0,
          },
          {
            name: 'min_stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'unit_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'purchase_unit_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'conversion_ratio',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 1,
          },
          {
            name: 'category_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'image',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'is_favorite',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true
    );

    // Add foreign keys for products
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['unit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'units',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['purchase_unit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'units',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'RESTRICT',
      })
    );

    // Customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'phone',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    // Sales table
    await queryRunner.createTable(
      new Table({
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'customer_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'tax',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['CASH', 'CARD', 'MOBILE', 'BALANCE', 'MIXED'],
          },
          {
            name: 'paid_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'credit_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'received_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'change_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    // Add foreign keys for sales
    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      })
    );

    // Sale items table
    await queryRunner.createTable(
      new Table({
        name: 'sale_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'sale_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'discount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
        ],
      }),
      true
    );

    // Add foreign keys for sale_items
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
      })
    );

    // Customer deposits table
    await queryRunner.createTable(
      new Table({
        name: 'customer_deposits',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'customer_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['LOAN', 'RETURN'],
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'reason',
            type: 'text',
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'customer_deposits',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      })
    );

    // Stock movements table
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'],
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'reason',
            type: 'text',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'from_warehouse',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'to_warehouse',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
          {
            name: 'value_at_time',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    // Inventory audits table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_audits',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'inventory_audits',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    // Inventory audit items table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_audit_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'audit_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'product_name',
            type: 'varchar',
          },
          {
            name: 'system_qty',
            type: 'int',
          },
          {
            name: 'physical_qty',
            type: 'int',
          },
          {
            name: 'difference',
            type: 'int',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'inventory_audit_items',
      new TableForeignKey({
        columnNames: ['audit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'inventory_audits',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_audit_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
      })
    );

    // Cash closings table
    await queryRunner.createTable(
      new Table({
        name: 'cash_closings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'expected_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'actual_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'difference',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'denominations',
            type: 'json',
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'cash_closings',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    // Petty cash table
    await queryRunner.createTable(
      new Table({
        name: 'petty_cash',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['IN', 'OUT'],
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'reason',
            type: 'text',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'timestamp',
            type: 'datetime',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'petty_cash',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX idx_products_barcode ON products(barcode)`);
    await queryRunner.query(`CREATE INDEX idx_products_sku ON products(sku)`);
    await queryRunner.query(`CREATE INDEX idx_sales_timestamp ON sales(timestamp)`);
    await queryRunner.query(`CREATE INDEX idx_stock_movements_timestamp ON stock_movements(timestamp)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('petty_cash');
    await queryRunner.dropTable('cash_closings');
    await queryRunner.dropTable('inventory_audit_items');
    await queryRunner.dropTable('inventory_audits');
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('customer_deposits');
    await queryRunner.dropTable('sale_items');
    await queryRunner.dropTable('sales');
    await queryRunner.dropTable('customers');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('suppliers');
    await queryRunner.dropTable('warehouses');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('units');
  }
}

