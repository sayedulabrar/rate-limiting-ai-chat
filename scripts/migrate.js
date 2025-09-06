const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const config = require("../src/config/app");

function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.DATABASE_PATH, (err) => {
      if (err) return reject(err);
    });

    const migrationPath = path.join(__dirname, "../migrations/001_initial_schema.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Running migration...");
    db.exec(migrationSQL, (err) => {
      if (err) return reject(err);

      console.log("Migration completed successfully!");

      // Insert test row
      const testQuery = `
        INSERT INTO rate_limit_usage (identifier, window_start, request_count) 
        VALUES (?, datetime('now'), 1) 
        RETURNING identifier, window_start, request_count
      `;

      db.get(testQuery, [`test_user_${Date.now()}`], (err, row) => {
        if (err) return reject(err);

        console.log("Test record created:", row);

        db.run("DELETE FROM rate_limit_usage WHERE identifier LIKE ?", ["test_user_%"], (err) => {
          if (err) return reject(err);

          console.log("Test record cleaned up");

          db.close((err) => {
            if (err) return reject(err);
            console.log("Database connection closed");
            resolve();
          });
        });
      });
    });
  });
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}
