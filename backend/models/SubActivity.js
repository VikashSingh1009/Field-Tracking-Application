'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubActivity = sequelize.define(
    'SubActivity',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        activity_name: {
            type:      DataTypes.STRING(255),
            allowNull: false,
            unique:    true
        },
        is_active: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        tableName:  'sub_activities',
        timestamps: false   // fix
    }
);

module.exports = SubActivity;