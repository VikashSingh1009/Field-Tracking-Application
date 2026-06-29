// sequelize import 

const {Sequelize} = require('sequelize');
// create instance of sequelize 

require('dotenv').config();
// load .env value 



// create sequelize instance 
const sequelize = new Sequelize(
    process.env.DB_NAME,     
    process.env.DB_USER,      
    process.env.DB_PASSWORD,  
    {
        host:    process.env.DB_HOST,  
        port:    process.env.DB_PORT,  
        dialect: 'postgres',      //which db use     

        
        pool: {
            max:     10,    
            min:     0,      
            acquire: 30000,  
            idle:    10000  
        },

        logging: false,

        dialectOptions: {
            ssl: {
            require: true,
            rejectUnauthorized: false
            }
        }   //don't show sql queries in console
    }
);


// connection test 
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected Successfully');
    } catch (error) {
        console.error('Database Connection Failed', error.message);

        process.exit(1);
    }
};

module.exports = {sequelize, connectDB};