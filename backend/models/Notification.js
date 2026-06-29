'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define(
    'Notification',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },
        to_user_id: {
            type:      DataTypes.INTEGER,
            allowNull: false
        },
        from_user_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        type: {
            type:      DataTypes.ENUM(
                           'Task Assigned',
                           'Task Completed',
                           'Task Delayed',
                           'Status Updated',
                           'Excel Uploaded',
                           'Supervisor Assigned',
                           'Remarks Added'
                       ),
            allowNull: false
        },
        title: {
            type:      DataTypes.STRING(255),
            allowNull: true
        },
        message: {
            type:      DataTypes.TEXT,
            allowNull: true
        },
        reference_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },
        reference_type: {
            type:      DataTypes.STRING(50),
            allowNull: true
        },
        is_read: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false
        },
        created_at: {
            type:         DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName:  'notifications',
        timestamps: false   // fix 
    }
);

module.exports = Notification;