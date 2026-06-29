'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExcelUpload = sequelize.define(
    'ExcelUpload',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        uploaded_by: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        file_name: {
            type:      DataTypes.STRING(255),
            allowNull: false
        },
        file_path: {
            type:      DataTypes.STRING(500),
            allowNull: false
        },
        total_rows: {
            type:         DataTypes.INTEGER,
            defaultValue: 0
        },
        processed_rows: {
            type:         DataTypes.INTEGER,
            defaultValue: 0
        },
        failed_rows: {
            type:         DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type:         DataTypes.ENUM(
                              'Processing',
                              'Completed',
                              'Failed',
                              'Partial'
                          ),
            defaultValue: 'Processing'
        },
        error_log: {
            type:      DataTypes.JSONB,
            allowNull: true
        },
        uploaded_at: {
            type:         DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        processed_at: {
            type:      DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName:  'excel_uploads',
        timestamps: false   //  FIX
    }
);

module.exports = ExcelUpload;