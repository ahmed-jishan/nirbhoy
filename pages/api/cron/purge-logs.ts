/**
 * GET /api/cron/purge-logs
 *
 * Cron job (triggered by Vercel CRON) to purge old Firestore audit logs.
 * Keeps only the last 90 days of activity. Configure via:
 *   - CRON_SECRET: shared secret to authenticate the request
 *   - LOG_RETENTION_DAYS: how many days to keep (default 90)
 *
 * Protected by CRON_SECRET env var — only calls with the correct
 * Authorization header will be accepted.
 */

import { adminDb } from "../../../lib/firebaseAdmin";
import { logger } from "../../../lib/logger";

const CRON_SECRET = process.env.CRON_SECRET || "";
const RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || "90", 10);
const BATCH_SIZE = 100;

export default async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Require CRON_SECRET for authentication
  const auth = req.headers.authorization || "";
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  // Validate retention days
  if (RETENTION_DAYS < 1 || RETENTION_DAYS > 365) {
    return res.status(400).json({ error: "LOG_RETENTION_DAYS must be between 1 and 365." });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  let totalDeleted = 0;
  const collections = ["complaints", "admins", "votes"];
  const errors: string[] = [];

  for (const colName of collections) {
    try {
      const db = adminDb();
      let batch = await db
        .collection(colName)
        .where("createdAt", "<", cutoff)
        .limit(BATCH_SIZE)
        .get();

      let deleted = 0;
      while (!batch.empty) {
        const writes = batch.docs.map((doc) => doc.ref.delete());
        await Promise.all(writes);
        deleted += batch.size;

        batch = await db
          .collection(colName)
          .where("createdAt", "<", cutoff)
          .limit(BATCH_SIZE)
          .get();
      }

      totalDeleted += deleted;
      logger.info({ collection: colName, deleted }, "Purged old documents");
    } catch (err) {
      const msg = String(err?.message || err);
      errors.push(`${colName}: ${msg}`);
      logger.error({ err: msg, collection: colName }, "Purge failed for collection");
    }
  }

  return res.status(200).json({
    ok: true,
    deleted: totalDeleted,
    retentionDays: RETENTION_DAYS,
    cutoffDate: cutoff.toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  });
}