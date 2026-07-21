/* eslint-disable no-console */
/**
 * sync-admins.js — DB-driven admin provisioning.
 *
 * The Firestore `admins` collection is the SINGLE SOURCE OF TRUTH for who is
 * an admin. There are NO hardcoded admins anywhere in the codebase.
 *
 * Workflow to add an admin:
 *   1. Add a document to the `admins` collection in Firestore with fields:
 *        - email    (string, required)
 *        - password (string, required ONLY for first-time provisioning)
 *        - role     (string, optional — defaults to "moderator")
 *      The document ID can be anything (auto-ID is fine).
 *   2. Run:  npm run sync-admins
 *
 * What this script does for every admin doc:
 *   - Ensures a Firebase Authentication user exists for that email
 *     (creates it, or updates the password if a `password` field is present).
 *   - Re-keys the admin record to the Firebase Auth `uid` (the login flow
 *     looks up admins by uid), migrating away from any auto-ID doc.
 *   - STRIPS the plaintext `password` field from Firestore — passwords only
 *     ever live hashed inside Firebase Auth, never in the database.
 *
 * This makes login work: signInWithEmailAndPassword() authenticates against
 * Firebase Auth, and the server-side allowlist check finds admins/{uid}.
 */
const fs = require("fs");
const path = require("path");

// Load .env.local by hand so this script has no extra dependency.
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvLocal();

const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const auth = admin.auth();
const db = admin.firestore();

/** Ensure a Firebase Auth user exists for `email`; set/update password if given. */
async function ensureAuthUser(email, password) {
  try {
    const user = await auth.getUserByEmail(email);
    if (password) {
      await auth.updateUser(user.uid, { password });
      console.log(`  ↻ Updated password for existing Auth user ${email} (uid: ${user.uid}).`);
    } else {
      console.log(`  ✓ Auth user already exists for ${email} (uid: ${user.uid}).`);
    }
    return user.uid;
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      if (!password) {
        throw new Error(
          `No Firebase Auth user for ${email} and no "password" field in the admin doc. ` +
          `Add a temporary "password" field to provision this admin.`
        );
      }
      const user = await auth.createUser({ email, password });
      console.log(`  + Created Auth user for ${email} (uid: ${user.uid}).`);
      return user.uid;
    }
    throw err;
  }
}

async function main() {
  const snapshot = await db.collection("admins").get();

  if (snapshot.empty) {
    console.log("No documents found in the `admins` collection. Nothing to sync.");
    console.log("Add an admin doc with { email, password, role } then re-run this script.");
    process.exit(0);
  }

  let processed = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const email = (data.email || "").trim();
    const password = data.password ? String(data.password) : null;
    const role = (data.role || "moderator").trim();

    if (!email) {
      console.warn(`- Skipping doc "${doc.id}": no "email" field.`);
      failed += 1;
      continue;
    }

    console.log(`\n• Processing admin: ${email} (doc: ${doc.id})`);
    try {
      const uid = await ensureAuthUser(email, password);

      // The login flow looks up admins/{uid}. Write/refresh the canonical
      // record keyed by uid, WITHOUT any plaintext password.
      await db.collection("admins").doc(uid).set(
        {
          email,
          role,
          createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (doc.id !== uid) {
        // This was an auto-ID doc — migrate it away so we don't keep a
        // stray record (which also still holds the plaintext password).
        await doc.ref.delete();
        console.log(`  ⇄ Migrated doc "${doc.id}" → admins/${uid} (auth uid).`);
      } else if (password) {
        // Same doc but had a plaintext password — remove it.
        await db.collection("admins").doc(uid).update({
          password: admin.firestore.FieldValue.delete(),
        });
        console.log(`  ⌫ Removed plaintext password field from admins/${uid}.`);
      }

      console.log(`  ✔ ${email} is ready to log in (role: ${role}).`);
      processed += 1;
    } catch (err) {
      console.error(`  ✖ Failed to provision ${email}: ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\nDone. Provisioned: ${processed}, Failed/Skipped: ${failed}.`);
  console.log("Admins can now log in at /admin/login with their email + password.");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("sync-admins failed:", err);
  process.exit(1);
});
