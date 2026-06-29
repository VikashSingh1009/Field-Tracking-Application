'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true
    },
    performed_by: {
        type:      DataTypes.INTEGER,
        allowNull: false
        // Kaun ne action kiya
    },
    action: {
        type:      DataTypes.STRING(100),
        allowNull: false
        /*
        Examples:
        USER_CREATED, USER_DELETED
        USER_ACTIVATED, USER_DEACTIVATED
        WORKER_ASSIGNED, WORKER_UNASSIGNED
        MASTER_CREATED, MASTER_UPDATED
        LOCATION_CREATED, SUPERVISOR_ASSIGNED
        PASSWORD_RESET
        */
    },
    module: {
        type:      DataTypes.STRING(100),
        allowNull: false
        /*
        Examples:
        USER_MANAGEMENT
        MASTER_MANAGEMENT
        LOCATION_MANAGEMENT
        ASSIGNMENT_MANAGEMENT
        */
    },
    target_id: {
        type:         DataTypes.INTEGER,
        defaultValue: null
        // Jis record pe action hua uska ID
    },
    target_type: {
        type:         DataTypes.STRING(50),
        defaultValue: null
        // 'User', 'Location', 'MasterLookup' etc.
    },
    description: {
        type:         DataTypes.TEXT,
        defaultValue: null
        // Human readable message
        // e.g., "Worker John assigned to Supervisor Mike"
    },
    ip_address: {
        type:         DataTypes.STRING(50),
        defaultValue: null
    }
}, {
    tableName:   'audit_logs', // ← Naya table banega auto
    underscored: true,
    timestamps:  true,
    createdAt:   'created_at',
    updatedAt:   false  // Audit log update nahi hota
});

module.exports = AuditLog;