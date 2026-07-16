/* eslint-disable no-console */
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

const email = process.env.NIRBHOY_ADMIN_EMAIL;
const password = process.env.NIRBHOY_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set NIRBHOY_ADMIN_EMAIL and NIRBHOY_ADMIN_PASSWORD in .env.local first.");
  process.exit(1);
}

async function main() {
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Firebase Auth user already exists for ${email} (uid: ${userRecord.uid}).`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      userRecord = await admin.auth().createUser({ email, password });
      console.log(`Created Firebase Auth user for ${email} (uid: ${userRecord.uid}).`);
    } else {
      throw err;
    }
  }

  await admin.firestore().collection("admins").doc(userRecord.uid).set(
    {
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Added ${email} to the admins allowlist in Firestore.`);
  console.log("You can now log in at /admin/login with this email and password.");
  process.exit(0);
}

main().catch((err) => {
  console.error("create-admin failed:", err);
  process.exit(1);
});
