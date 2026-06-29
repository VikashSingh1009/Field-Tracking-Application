'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LocationActivity = sequelize.define(
    'LocationActivity',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        location_id: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        activity_id: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        planned_start_date: {
            type:      DataTypes.DATEONLY,
            allowNull: true
        },
        planned_end_date: {
            type:      DataTypes.DATEONLY,
            allowNull: true
        },
        actual_start_date: {
            type:      DataTypes.DATEONLY,
            allowNull: true
        },
        actual_end_date: {
            type:      DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type:         DataTypes.ENUM(
                              'Not Started',
                              'In Progress',
                              'Completed',
                              'Incomplete',
                              'Delayed',
                              'On Hold'
                          ),
            defaultValue: 'Not Started'
        },
        progress_pct: {
            type:         DataTypes.SMALLINT,
            defaultValue: 0
        },
        remarks: {
            type:      DataTypes.TEXT,
            allowNull: true
        },
        worker_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        worker_assigned_at: {
            type:      DataTypes.DATE,
            allowNull: true
        },
        worker_instructions: {
            type:      DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName:  'location_activities',
        timestamps: false,   // fix
        indexes: [
            {
                unique: true,
                fields: ['location_id', 'activity_id'],
                name:   'unique_location_activity'
            }
        ]
    }
);

module.exports = LocationActivity;