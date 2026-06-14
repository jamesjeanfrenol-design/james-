import { AppDataSource } from '../config/database';

async function createUnitConversionsTable() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Créer la table product_unit_conversions
      console.log('Creating product_unit_conversions table...');
      try {
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS \`product_unit_conversions\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`product_id\` int(11) NOT NULL,
            \`unit_id\` int(11) NOT NULL,
            \`conversion_ratio\` decimal(10,6) NOT NULL,
            \`custom_price\` decimal(10,2) DEFAULT NULL,
            \`is_default\` tinyint(1) NOT NULL DEFAULT 0,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`IDX_product_unit_conversions_product_unit\` (\`product_id\`, \`unit_id\`),
            KEY \`IDX_product_unit_conversions_product\` (\`product_id\`),
            KEY \`IDX_product_unit_conversions_unit\` (\`unit_id\`),
            CONSTRAINT \`FK_product_unit_conversions_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`FK_product_unit_conversions_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`units\` (\`id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✓ Table created');
      } catch (error: any) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠ Table already exists');
        } else {
          throw error;
        }
      }

      // Ajouter la colonne sale_unit_id à sale_items
      console.log('Adding sale_unit_id column to sale_items...');
      try {
        await queryRunner.query(`
          ALTER TABLE \`sale_items\` 
          ADD COLUMN \`sale_unit_id\` INT NULL AFTER \`unit_type\`
        `);
        console.log('✓ Column added');
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠ Column already exists');
        } else {
          throw error;
        }
      }

      // Ajouter la clé étrangère pour sale_unit_id
      console.log('Adding foreign key constraint...');
      try {
        await queryRunner.query(`
          ALTER TABLE \`sale_items\` 
          ADD CONSTRAINT FK_sale_items_sale_unit 
          FOREIGN KEY (sale_unit_id) REFERENCES units(id) ON DELETE SET NULL
        `);
        console.log('✓ Foreign key constraint added');
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log('⚠ Foreign key already exists');
        } else {
          console.log('⚠ Error adding foreign key (may already exist):', error.message);
        }
      }

      // Migrer les données existantes
      console.log('Migrating existing data...');
      await queryRunner.query(`
        INSERT INTO \`product_unit_conversions\` (\`product_id\`, \`unit_id\`, \`conversion_ratio\`, \`is_default\`, \`custom_price\`)
        SELECT \`id\`, \`unit_id\`, 1, 1, NULL
        FROM \`products\`
        WHERE NOT EXISTS (
          SELECT 1 FROM \`product_unit_conversions\` 
          WHERE \`product_unit_conversions\`.\`product_id\` = \`products\`.\`id\` 
          AND \`product_unit_conversions\`.\`unit_id\` = \`products\`.\`unit_id\`
        )
      `);
      console.log('✓ Default conversions created');

      await queryRunner.query(`
        INSERT INTO \`product_unit_conversions\` (\`product_id\`, \`unit_id\`, \`conversion_ratio\`, \`is_default\`, \`custom_price\`)
        SELECT \`id\`, \`purchase_unit_id\`, \`conversion_ratio\`, 0, NULL
        FROM \`products\`
        WHERE \`purchase_unit_id\` != \`unit_id\`
        AND \`conversion_ratio\` != 1
        AND NOT EXISTS (
          SELECT 1 FROM \`product_unit_conversions\` 
          WHERE \`product_unit_conversions\`.\`product_id\` = \`products\`.\`id\` 
          AND \`product_unit_conversions\`.\`unit_id\` = \`products\`.\`purchase_unit_id\`
        )
      `);
      console.log('✓ Purchase unit conversions created');

      console.log('\n✅ All tables and data migrated successfully!');
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUnitConversionsTable();

