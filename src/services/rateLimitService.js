const sqlite3 = require('sqlite3').verbose();
const NodeCache = require('node-cache');
const config = require('../config/app');

const cache = new NodeCache({ stdTTL: 0 }); // No auto-expiry
const db = new sqlite3.Database(config.DATABASE_PATH);

class RateLimitService {
    async getRateLimit(identifier) {
        // Check in-memory cache first
        let usage = cache.get(identifier);
        if (usage) return usage;

        // Cache miss: try to fetch from database
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT request_count, window_start FROM rate_limit_usage WHERE identifier = ?',
                [identifier],
                (err, row) => {
                    if (err) return reject(err);

                    const now = new Date();
                    if (row) {
                        const { request_count, window_start } = row;
                        const windowStart = new Date(window_start);
                        const diffMs = now - windowStart;
                        const diffHours = diffMs / (1000 * 60 * 60);

                        // Reset if window has expired
                        if (diffHours >= 1) {
                            usage = { request_count: 0, window_start: now };
                        } else {
                            usage = { request_count, window_start };
                        }
                    } else {
                        // No database record: initialize in cache only
                        usage = { request_count: 0, window_start: now };
                    }

                    cache.set(identifier, usage);
                    resolve(usage);
                }
            );
        });
    }

    async incrementUsage(identifier) {
        const usage = await this.getRateLimit(identifier);
        usage.request_count += 1;
        usage.last_access = new Date(); // Track last access for cleanup
        cache.set(identifier, usage);
        return usage;
    }

    async resetUsage(identifier) {
        const now = new Date();
        cache.set(identifier, { request_count: 0, window_start: now, last_access: now });
    }

    async getTierLimit(tier) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT requests_per_hour FROM rate_limit_tiers WHERE tier = ?',
                [tier],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row?.requests_per_hour || 3); // Default to guest limit
                }
            );
        });
    }

    async syncCacheToDatabase() {
        const keys = cache.keys();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare(
                    'INSERT OR REPLACE INTO rate_limit_usage (identifier, window_start, request_count, last_access) VALUES (?, ?, ?, ?)'
                );
                for (const identifier of keys) {
                    const usage = cache.get(identifier);
                    if (usage) {
                        stmt.run(
                            [identifier, usage.window_start.toISOString(), usage.request_count, usage.last_access.toISOString()],
                            (err) => {
                                if (err) reject(err);
                            }
                        );
                    }
                }
                stmt.finalize((err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        });
    }

    async cleanupInactiveUsers() {
        // Sync all cache entries to database
        await this.syncCacheToDatabase();

        // Remove inactive entries from cache only
        const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
        const keys = cache.keys();
        for (const identifier of keys) {
            const usage = cache.get(identifier);
            if (usage && new Date(usage.last_access) < threshold) {
                cache.del(identifier);
            }
        }
    }
}

module.exports = new RateLimitService();