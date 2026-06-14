import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseStockPrecision1770576000000 implements MigrationInterface {
    name = 'IncreaseStockPrecision1770576000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Increase precision for Products
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_magasin\` decimal(12,6) NOT NULL DEFAULT '0.000000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_principal\` decimal(12,6) NOT NULL DEFAULT '0.000000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`min_stock\` decimal(12,6) NOT NULL DEFAULT '0.000000'`);

        // Increase precision for Stock Movements
        await queryRunner.query(`ALTER TABLE \`stock_movements\` MODIFY \`quantity\` decimal(12,6) NOT NULL`);

        // Increase precision for Sale Items (important for fractional sales)
        await queryRunner.query(`ALTER TABLE \`sale_items\` MODIFY \`quantity\` decimal(12,6) NOT NULL`);

        // Increase precision for Product Unit Conversions (CRITICAL for small ratios)
        await queryRunner.query(`ALTER TABLE \`product_unit_conversions\` MODIFY \`conversion_ratio\` decimal(12,6) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to DECIMAL(10,4)
        await queryRunner.query(`ALTER TABLE \`product_unit_conversions\` MODIFY \`conversion_ratio\` decimal(10,4) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`sale_items\` MODIFY \`quantity\` decimal(10,4) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` MODIFY \`quantity\` decimal(10,4) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`min_stock\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_principal\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_magasin\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);
    }
}
