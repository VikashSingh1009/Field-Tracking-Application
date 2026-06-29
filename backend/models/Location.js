'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Location = sequelize.define(
    'Location',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull: false
        },
        corridor_name: {
            type:      DataTypes.STRING(500),
            allowNull: true
        },
        upload_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        serial_number: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        location_name: {
            type:      DataTypes.STRING(255),
            allowNull: false
        },

        //  Entry / Exit type
        location_type: {
            type:      DataTypes.STRING(100),
            allowNull: true
        },
        proposed_solution: {
            type:      DataTypes.STRING(255),
            allowNull: true
        },
        no_of_lanes: {
            type:         DataTypes.INTEGER,
            defaultValue: 0
        },

        no_of_roads: {
            type:         DataTypes.INTEGER,
            defaultValue: 0
        },

        //  Phase FK
        phase_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },

        //  Vendor FK
        vendor_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },

        //  Supervisor FK
        supervisor_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        supervisor_assigned_at: {
            type:      DataTypes.DATE,
            allowNull: true
        },
        overall_status: {
            type:         DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
            defaultValue: 'Not Started'
        }, //  Fixed — closing }, was missing here!
        overall_progress: {
            type:         DataTypes.SMALLINT,
            defaultValue: 0
        },
        is_active: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        tableName:  'locations',
        timestamps: false
    }
);

module.exports = Location;