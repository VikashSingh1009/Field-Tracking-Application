

const express = require('express');  //express app load karo 
const cors = require('cors');  //allow cross - origin of different path 
const path = require('path');  //handle file folder path
const bcrypt = require('bcryptjs');  //password hashing
require('dotenv').config();  //read .env file


const {
    connectDB,   //db connection
    syncDatabase,  ///Table create/update
    createDefaultAdmin,   //default admin
} = require('./models/index');

const app = express();  //express app create
// create express application instance 



// cors middleware 
app.use(cors({
    origin:         '*',      //allow everyone 
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',  //for json body  
        'Authorization'  //for jwt token 
    ]
}));

app.use(express.json({ limit: '50mb' }));  //json body parser - parse request body in json 
// express.json() -> req.body.phone, req.body.password

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// url encoded parser 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));   //static file save, access 


app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Field Tracking API is Running! 🚀',
        version: '1.0.0',
        time:    new Date().toISOString()
    });
});




// API ROUTE MOUNT 
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/admin',      require('./routes/masterLookupRoutes')); 
app.use('/api/supervisor', require('./routes/supervisorRoutes'));
app.use('/api/worker',     require('./routes/workerRoutes'));


// API ROUTE MOUNT
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));



const masterLookupRoutes = require('./routes/masterLookupRoutes');
app.use('/api/admin', masterLookupRoutes);
app.use('/api/supervisor', require('./routes/supervisorRoutes'));
app.use('/api/worker', require('./routes/workerRoutes'));


// 404 handler 
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});


// global error handler 

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Something went wrong',
        error:   err.message
    });
});


// const masterLookupRoutes = require('./routes/masterLookupRoutes');
// app.use('/api/admin', masterLookupRoutes);



const startServer = async () => {
    try{
        await connectDB();
        console.log('DB connected');
        await syncDatabase();
        console.log('Sync Done')

        const { sequelize } = require('./models/index');
        const [tables] = await sequelize.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            `
        );
        console.log(' Tables in DB:', tables.map(t => t.table_name));

        await createDefaultAdmin();
        console.log('Admin Ready');



        const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Started on PORT ${PORT}`);
});
    } catch(error){
        console.error('Server start Failed:', error.message);
    }
};


startServer();

