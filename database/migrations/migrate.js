const fs = require('fs').promises;
const path = require('path');
const { executeQuery, testConnection } = require('../config/database');

// Migration runner
class DatabaseMigrator {
  constructor() {
    this.schemaPath = path.join(__dirname, '../schema');
    this.migrations = [
      '01_create_users_table.sql',
      '02_create_drivers_table.sql',
      '03_create_admins_table.sql',
      '04_create_passengers_table.sql',
      '05_create_verification_table.sql',
      '06_create_documents_table.sql',
      '07_create_mobile_money_table.sql',
      '08_create_sessions_table.sql',
      '09_create_audit_logs_table.sql',
      '10_create_ghana_locations.sql'
    ];
  }

  async createMigrationsTable() {
    const createMigrationsTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename),
        INDEX idx_executed_at (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createMigrationsTableSQL);
    console.log('✅ Migrations table created');
  }

  async getExecutedMigrations() {
    try {
      const results = await executeQuery('SELECT filename FROM migrations ORDER BY executed_at');
      return results.map(row => row.filename);
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      return [];
    }
  }

  async executeMigration(filename) {
    try {
      const filePath = path.join(this.schemaPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Split SQL file by semicolon and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeQuery(statement);
        }
      }
      
      // Record migration as executed
      await executeQuery(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Migration executed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error.message);
      throw error;
    }
  }

  async runMigrations() {
    try {
      // Test database connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Cannot connect to database');
      }

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get list of executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      console.log('Executed migrations:', executedMigrations);

      // Run pending migrations
      let executed = 0;
      for (const migration of this.migrations) {
        if (!executedMigrations.includes(migration)) {
          await this.executeMigration(migration);
          executed++;
        } else {
          console.log(`⏭️  Skipping already executed migration: ${migration}`);
        }
      }

      console.log(`🎉 Migration completed! ${executed} new migrations executed.`);
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      process.exit(1);
    }
  }

  async rollbackLastMigration() {
    try {
      const executedMigrations = await executeQuery(
        'SELECT filename FROM migrations ORDER BY executed_at DESC LIMIT 1'
      );
      
      if (executedMigrations.length === 0) {
        console.log('No migrations to rollback');
        return;
      }
      
      const lastMigration = executedMigrations[0].filename;
      console.log(`Rolling back migration: ${lastMigration}`);
      
      // Remove from migrations table
      await executeQuery('DELETE FROM migrations WHERE filename = ?', [lastMigration]);
      
      console.log(`✅ Migration rollback completed: ${lastMigration}`);
      console.log('⚠️  Note: You may need to manually drop tables or revert schema changes');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2];

  switch (command) {
    case 'up':
      await migrator.runMigrations();
      break;
    case 'rollback':
      await migrator.rollbackLastMigration();
      break;
    default:
      console.log('Usage: node migrate.js [up|rollback]');
      console.log('  up       - Run pending migrations');
      console.log('  rollback - Rollback last migration');
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration script error:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseMigrator;