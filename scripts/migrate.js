require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../src/config/app');

async function runMigration() {
    const db = new sqlite3.Database(config.DATABASE_PATH, (err) => {
        if (err) {
            console.error('Failed to connect to SQLite:', err);
            process.exit(1);
        }
    });

    try {
        console.log('Connecting to SQLite database...');

        console.log('Reading migration file...');
        const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        db.exec(migrationSQL, (err) => {
            if (err) {
                console.error('Migration failed:', err);
                process.exit(1);
            }
        });

        console.log('Migration completed successfully!');

        // Test the schema by inserting a test record
        console.log('Testing schema with test data...');
        const testQuery = `
            INSERT INTO rate_limit_usage (identifier, window_start, request_count) 
            VALUES (?, datetime('now'), 1) 
            RETURNING identifier, window_start, request_count
        `;
        db.get(testQuery, [`test_user_${Date.now()}`], (err, row) => {
            if (err) {
                console.error('Test insert failed:', err);
                process.exit(1);
            }
            console.log('Test record created:', row);

            // Clean up test record
            db.run('DELETE FROM rate_limit_usage WHERE identifier LIKE ?', ['test_user_%'], (err) => {
                if (err) {
                    console.error('Test cleanup failed:', err);
                    process.exit(1);
                }
                console.log('Test record cleaned up');
            });
        });

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database:', err);
            console.log('Database connection closed');
        });
    }
}

if (require.main === module) {
    runMigration().then(() => {
        console.log('Migration script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
}

module.exports = { runMigration };