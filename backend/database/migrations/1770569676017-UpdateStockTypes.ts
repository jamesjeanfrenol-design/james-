import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStockTypes1770569676017 implements MigrationInterface {
    name = 'UpdateStockTypes1770569676017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update Products table stock columns to decimal to support fractional quantities
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_magasin\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_principal\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`min_stock\` decimal(10,4) NOT NULL DEFAULT '0.0000'`);

        // Update Stock Movements quantity
        await queryRunner.query(`ALTER TABLE \`stock_movements\` MODIFY \`quantity\` decimal(10,4) NOT NULL`);

        // Update Sale Items quantity
        await queryRunner.query(`ALTER TABLE \`sale_items\` MODIFY \`quantity\` decimal(10,4) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to INT (lossy reversion)
        await queryRunner.query(`ALTER TABLE \`sale_items\` MODIFY \`quantity\` int(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` MODIFY \`quantity\` int(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`min_stock\` int(11) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_principal\` int(11) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`products\` MODIFY \`stock_magasin\` int(11) NOT NULL DEFAULT '0'`);
    }
}
