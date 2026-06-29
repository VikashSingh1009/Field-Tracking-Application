'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskUpdate = sequelize.define(
    'TaskUpdate',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        location_activity_id: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        updated_by: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        old_status: {
            type:      DataTypes.STRING(50),
            allowNull: true
        },
        new_status: {
            type:      DataTypes.STRING(50),
            allowNull: true
        },
        old_progress: {
            type:      DataTypes.SMALLINT,
            allowNull: true
        },
        new_progress: {
            type:      DataTypes.SMALLINT,
            allowNull: true
        },
        remarks: {
            type:      DataTypes.TEXT,
            allowNull: true
        },
        photos: {
            type:      DataTypes.JSONB,
            allowNull: true
        },
        photo_type: {
            type:      DataTypes.ENUM('Before', 'During', 'After', 'Issue'),
            allowNull: true
        },
        latitude: {
            type:      DataTypes.DECIMAL(9, 6),
            allowNull: true
        },
        longitude: {
            type:      DataTypes.DECIMAL(9, 6),
            allowNull: true
        },
        created_at: {
            type:         DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName:  'task_updates',
        timestamps: false   // fix 
    }
);

module.exports = TaskUpdate;