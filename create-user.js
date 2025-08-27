// create-user.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createUser(username, password) {
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
    await db.getConnection();
    console.log('✅ Connected to MySQL');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      console.log(`\n⚠️ User '${username}' already exists. Updating password instead.`);
      await db.execute('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
      console.log(`✅ Password updated for user '${username}'`);
    } else {
      // Insert new user
      await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
      console.log(`\n✅ User '${username}' created successfully`);
    }

    // Verify the user was created/updated
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    console.log(`\nUser details:`);
    console.log(`- ID: ${user.id}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Password hash: ${user.password.substring(0, 10)}...`);
    console.log(`\n🔑 You can now login with:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

    await db.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  rl.close();
}

// Get user input
console.log('Create a new user or update existing user password');
rl.question('Enter username: ', (username) => {
  rl.question('Enter password: ', (password) => {
    createUser(username, password);
  });
});