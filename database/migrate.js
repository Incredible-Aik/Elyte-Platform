const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'elyte_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'elyte_platform',
    password: process.env.DB_PASSWORD || 'elyte_password',
    port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add-driver-admin-tables.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Connect to database
        const client = await pool.connect();

        try {
            // Run migration
            await client.query(migrationSQL);
            console.log('✅ Migration completed successfully!');
            
            // Check if tables were created
            const result = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('drivers', 'admins', 'driver_licenses', 'admin_access_permissions')
                ORDER BY table_name
            `);
            
            console.log('📊 Created tables:');
            result.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function checkDatabaseConnection() {
    try {
        console.log('🔍 Checking database connection...');
        const client = await pool.connect();
        
        const result = await client.query('SELECT NOW() as current_time');
        console.log(`✅ Database connected! Current time: ${result.rows[0].current_time}`);
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n💡 Please ensure PostgreSQL is running and credentials are correct in .env file');
        return false;
    }
}

async function main() {
    console.log('🚀 Elyte Platform Database Migration Tool\n');

    // Check connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
        process.exit(1);
    }

    // Run migrations
    await runMigrations();
    
    console.log('\n🎉 Database setup completed! You can now start the server with: npm start');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runMigrations, checkDatabaseConnection };