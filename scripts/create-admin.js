/* eslint-disable no-console */
/**
 * DEPRECATED — hardcoded/env-based admin creation has been removed.
 *
 * Admins are now DB-driven. The Firestore `admins` collection is the single
 * source of truth. To add an admin:
 *
 *   1. Add a document to the `admins` collection in Firestore with fields:
 *        email    (required)
 *        password (required only for first-time provisioning)
 *        role     (optional, defaults to "moderator")
 *   2. Run:  npm run sync-admins
 *
 * See scripts/sync-admins.js for the implementation.
 */
console.error(
  "`create-admin` is deprecated. Add the admin to the Firestore `admins` " +
  "collection (fields: email, password, role) and run `npm run sync-admins` instead."
);
process.exit(1);
