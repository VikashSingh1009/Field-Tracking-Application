'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterLookup = sequelize.define('MasterLookup', {
    id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true
    },
    category: {
        type:      DataTypes.STRING(50),
        allowNull: false
        /*
        Categories hongi:
        - location_type   (Entry/Exit, Square etc.)
        - priority        (low, medium, high, critical)
        - status          (pending, in_progress etc.)
        - zone            (Zone A, Zone B etc.)
        - activity_type   (Survey, Installation etc.)
        */
    },
    value: {
        type:      DataTypes.STRING(100),
        allowNull: false
        // Actual value jo save hogi DB mein
        // e.g., 'entry_exit', 'high', 'zone_a'
    },
    label: {
        type:      DataTypes.STRING(100),
        allowNull: false
        // Jo frontend pe dikhega
        // e.g., 'Entry/Exit', 'High', 'Zone A'
    },
    description: {
        type:         DataTypes.TEXT,
        defaultValue: null
    },
    sort_order: {
        type:         DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type:         DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_by: {
        type:         DataTypes.INTEGER,
        allowNull:    true
    }
}, {
    tableName:  'master_lookups', // ← Tumhara existing table
    underscored: true,
    timestamps:  true,
    createdAt:   'created_at',
    updatedAt:   'updated_at'
});

module.exports = MasterLookup;