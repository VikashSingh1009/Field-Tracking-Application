// 📁 migrations/create-master-lookups.js

'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('master_lookups', {
            id: {
                type:          Sequelize.INTEGER,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false
            },
            category: {
                type:      Sequelize.STRING(100),
                allowNull: false
            },
            value: {
                type:      Sequelize.STRING(100),
                allowNull: false
            },
            label: {
                type:      Sequelize.STRING(150),
                allowNull: false
            },
            description: {
                type:      Sequelize.STRING(255),
                allowNull: true
            },
            sort_order: {
                type:         Sequelize.INTEGER,
                defaultValue: 0
            },
            is_active: {
                type:         Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_by: {
                type:      Sequelize.INTEGER,
                allowNull: true
            }
            // ✅ No created_at/updated_at — timestamps: false!
        });

        // Indexes
        await queryInterface.addIndex('master_lookups', ['category'],
            { name: 'idx_master_lookups_category' }
        );
        await queryInterface.addIndex('master_lookups', ['is_active'],
            { name: 'idx_master_lookups_active' }
        );
        await queryInterface.addIndex('master_lookups',
            ['category', 'value'],
            { unique: true, name: 'unique_category_value' }
        );
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('master_lookups');
    }
};