'use strict'
module.exports = {
    up: async (queryInterface) =>{
        await queryInterface.bulkInsert('master_lookups', [
            {
                category: 'LOCATION_TYPE',
                value: 'Entry/Exit',
                label: 'Entry/Exit',
                sort_order: 1,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'LOCATION_TYPE',
                value: 'Square',
                label: 'Square',
                sort_order: 'Square',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'LOCATION_TYPE',
                value: 'Tri Junction',
                label: 'Tri Junction',
                sort_order: 3,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'LOCATION_TYPE',
                value: 'Approach Road to GR',
                label: 'Approach Road to GR',
                sort_order: 4,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'LOCATION_TYPE',
                value: 'Surveillance Point',
                label: 'Surveillance Point',
                sort_order: 5,
                is_active: true,
                created_at : new Date(),
                updated_at: new Date()
            },
            {
                category: 'ACTIVITY_STATUS',
                value: 'Completed',
                label: 'Completed',
                sort_order: 1, 
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'ACTIVITY_STATUS',
                value: 'Not Started',
                label: 'Not Started',
                sort_order: 3,
                is_active: true,
                createdd_at: new Date(),
                updated_at: new Date()
            },
            {
                category: 'ACTIVITY_STATUS',
                value: 'Delayed',
                label: 'Delayed',
                sort_order: 4,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ])
    },

    down: async (queryInterface) => {
        await queryInterface.bulkDelete('master_lookups', null, {});
    }
}
