'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Phase = sequelize.define(
    'Phase',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        phase_name: {
            type:      DataTypes.STRING(100),
            allowNull: false,
            unique:    true
        }
    },
    {
        tableName:  'phases',
        timestamps: false   // FIX
    }
);

module.exports = Phase;