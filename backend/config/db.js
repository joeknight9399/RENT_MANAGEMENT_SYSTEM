const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a hardened connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // SECURITY & RESILIENCE HARDENING
    connectTimeout: 10000,        // 10 seconds max to establish a connection before failing
    acquireTimeout: 10000,        // 10 seconds max to grab a connection from the pool

    /* UNCOMMENT FOR PRODUCTION: 
       Enforces SSL encryption for data moving between your server and MySQL.
    */
    // ssl: {
    //     rejectUnauthorized: process.env.NODE_ENV === 'production'
    // }
});

// Fail-Fast Check: Instantly verify database connectivity on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ DATABASE CONNECTION ERROR: Verification pipeline failed.');
        console.error(`Reason: ${err.message}`);
        // Optional: process.exit(1); // Kill the server if DB is completely unreachable
    } else {
        console.log('✅ SECURE REGISTRY: Database connection pool verified and online.');
        connection.release(); // Vital: Return the connection back to the pool immediately
    }
});

// Export the promise-based wrapper for clean async/await syntax across routes
module.exports = pool.promise();