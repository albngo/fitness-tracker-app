import mysql from 'mysql2'; // Use mysql2 instead of mysql

// Define the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'fitness_tracker_user', // Username specified in the MySQL setup
    password: 'fitness', // Password specified in the MySQL setup
    database: 'fitness_tracker' // Database name specified in the MySQL setup
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log('Connected to database ' + db.config.database);
});

// Export the database connection
export default db;
