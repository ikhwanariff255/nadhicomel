// check-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    // Create connection
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // Check connection
    console.log('Checking database connection...');
    await db.getConnection();
    console.log('✅ Connected to MySQL');

    // Check if users table exists
    console.log('\nChecking users table...');
    const [tables] = await db.execute('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]).join(', '));

    // Check users in the table
    console.log('\nChecking users in the table...');
    const [users] = await db.execute('SELECT * FROM users');
    
    if (users.length === 0) {
      console.log('No users found in the database!');
    } else {
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        // Don't show the full password hash for security
        const passwordPreview = user.password ? `${user.password.substring(0, 10)}...` : 'null';
        console.log(`- ID: ${user.id}, Username: ${user.username}, Password: ${passwordPreview}`);
      });
    }

    await db.end();
  } catch (err) {
    console.error('❌ Database Error:', err.message);
  }
}

checkDatabase();