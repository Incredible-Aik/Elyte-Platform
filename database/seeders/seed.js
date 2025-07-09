const fs = require('fs').promises;
const path = require('path');
const { executeQuery, testConnection } = require('../config/database');

class DatabaseSeeder {
  constructor() {
    this.seedersPath = path.join(__dirname);
    this.seedFiles = [
      'ghana_locations.sql',
      'admin_roles.sql'
    ];
  }

  async createSeedersTable() {
    const createSeedersTableSQL = `
      CREATE TABLE IF NOT EXISTS seeders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename),
        INDEX idx_executed_at (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createSeedersTableSQL);
    console.log('✅ Seeders table created');
  }

  async getExecutedSeeders() {
    try {
      const results = await executeQuery('SELECT filename FROM seeders ORDER BY executed_at');
      return results.map(row => row.filename);
    } catch (error) {
      // If seeders table doesn't exist, return empty array
      return [];
    }
  }

  async executeSeed(filename) {
    try {
      const filePath = path.join(this.seedersPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Split SQL file by semicolon and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeQuery(statement);
        }
      }
      
      // Record seeder as executed
      await executeQuery(
        'INSERT INTO seeders (filename) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Seeder executed: ${filename}`);
    } catch (error) {
      console.error(`❌ Seeder failed: ${filename}`, error.message);
      throw error;
    }
  }

  async runSeeders() {
    try {
      // Test database connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Cannot connect to database');
      }

      // Create seeders table if it doesn't exist
      await this.createSeedersTable();

      // Get list of executed seeders
      const executedSeeders = await this.getExecutedSeeders();
      console.log('Executed seeders:', executedSeeders);

      // Run pending seeders
      let executed = 0;
      for (const seeder of this.seedFiles) {
        if (!executedSeeders.includes(seeder)) {
          await this.executeSeed(seeder);
          executed++;
        } else {
          console.log(`⏭️  Skipping already executed seeder: ${seeder}`);
        }
      }

      console.log(`🎉 Seeding completed! ${executed} new seeders executed.`);
    } catch (error) {
      console.error('❌ Seeding process failed:', error.message);
      process.exit(1);
    }
  }

  async resetSeeders() {
    try {
      console.log('⚠️  Resetting all seeders...');
      
      // Clear seeders table
      await executeQuery('DELETE FROM seeders');
      
      console.log('✅ Seeders table cleared. You can now run seeders again.');
    } catch (error) {
      console.error('❌ Seeder reset failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const seeder = new DatabaseSeeder();
  const command = process.argv[2];

  switch (command) {
    case 'run':
      await seeder.runSeeders();
      break;
    case 'reset':
      await seeder.resetSeeders();
      break;
    default:
      console.log('Usage: node seed.js [run|reset]');
      console.log('  run   - Run pending seeders');
      console.log('  reset - Reset seeders table');
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Seeder script error:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseSeeder;