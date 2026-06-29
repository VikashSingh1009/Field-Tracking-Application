'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vendor = sequelize.define(
    'Vendor',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        vendor_name: {
            type:      DataTypes.STRING(255),
            allowNull: false,
            unique:    true
        },
        phone: {
            type:      DataTypes.STRING(20),
            allowNull: true
        },
        email: {
            type:      DataTypes.STRING(255),
            allowNull: true
        }
    },
    {
        tableName:  'vendors',
        timestamps: false   // fix 
    }
);

module.exports = Vendor;