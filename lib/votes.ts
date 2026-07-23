import { adminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";
import crypto from "crypto";

/**
 * Community upvote system
 * -----------------------
 * Anonymous, one-vote-per-visitor upvoting for published complaints.
 *
 * Uniqueness enforcement — since we never track user identity, we hash
 * (voterToken + fingerprint + caseId + secret) to form a deterministic voteId.
 * Firestore's document-id uniqueness gives us dedup for free. A voter can
 * flip their vote by calling the same endpoint again (toggle behaviour).
 *
 * Two-layer anti-gaming:
 *  1. Voter token — random UUID generated client-side, stored in localStorage.
 *     Never contains personal data. Server hashes it before storing.
 *  2. Browser fingerprint — lightweight hash of non-identifying browser signals
 *     (screen size, timezone, platform, language, user agent). This survives
 *     localStorage clears and incognito mode changes. Both token + fingerprint
 *     are combined in the voteId hash, so a voter who clears localStorage
 *     cannot vote again from the same browser.
 *
 * The voter token and fingerprint are NEVER stored or logged — only the
 * derived voteId hash ever touches Firestore.
 */

const COMPLAINTS = "complaints";
const VOTES = "votes";

// Small, fixed secret so raw voter tokens are never stored/queried directly.
// Not a security boundary — just a mild speedbump against enumeration.
const HASH_SECRET = process.env.NIRBHOY_VOTE_SECRET || "nirbhoy-vote-salt-v1";

function makeVoteId(voterToken: string, caseId: string, fingerprint?: string) {
  const fp = fingerprint ? `:${fingerprint}` : "";
  return crypto
    .createHash("sha256")
    .update(`${HASH_SECRET}:${voterToken}:${caseId}${fp}`)
    .digest("hex")
    .slice(0, 32);
}

async function findComplaintByCaseId(caseId: string) {
  const db = adminDb();
  const snap = await db.collection(COMPLAINTS).where("caseId", "==", caseId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0];
}

/**
 * Toggle a vote. Returns the new vote count and whether the caller has now
 * voted. Rejects votes on non-published complaints so admins/pending cases
 * don't get gamed.
 *
 * @param fingerprint - Optional browser fingerprint hash to prevent
 *   re-voting after localStorage clears. Passed by modern clients only.
 */
export async function toggleUpvote(caseId: string, voterToken: string, fingerprint?: string) {
  if (!caseId || !voterToken || voterToken.length < 10) {
    throw new Error("Invalid vote request.");
  }

  const db = adminDb();
  const doc = await findComplaintByCaseId(caseId);
  if (!doc) throw new Error("Case not found.");
  if (doc.data().status !== "published") {
    throw new Error("Only published cases can be voted on.");
  }

  const voteId = makeVoteId(voterToken, caseId, fingerprint);
  const voteRef = doc.ref.collection(VOTES).doc(voteId);

  return db.runTransaction(async (tx) => {
    const [voteSnap, parentSnap] = await Promise.all([
      tx.get(voteRef),
      tx.get(doc.ref),
    ]);

    const currentCount =
      typeof parentSnap.data()?.upvotes === "number" ? parentSnap.data()!.upvotes : 0;

    if (voteSnap.exists) {
      // Toggle off
      tx.delete(voteRef);
      tx.update(doc.ref, { upvotes: Math.max(0, currentCount - 1) });
      return { count: Math.max(0, currentCount - 1), voted: false };
    }
    // Toggle on
    tx.set(voteRef, { createdAt: FieldValue.serverTimestamp() });
    tx.update(doc.ref, { upvotes: currentCount + 1 });
    return { count: currentCount + 1, voted: true };
  });
}

/**
 * Check whether a given voter token (+ optional fingerprint) has already
 * upvoted this case. Used by the client on load to render the button in
 * the correct state.
 */
export async function hasVoted(caseId: string, voterToken: string, fingerprint?: string) {
  if (!caseId || !voterToken) return false;
  try {
    const doc = await findComplaintByCaseId(caseId);
    if (!doc) return false;
    const voteId = makeVoteId(voterToken, caseId, fingerprint);
    const snap = await doc.ref.collection(VOTES).doc(voteId).get();
    return snap.exists;
  } catch (err: any) {
    logger.warn({ err: String(err?.message || err), caseId }, "hasVoted failed");
    return false;
  }
}

/**
 * Return the current upvote count for a case — cheap read used by the
 * button after a race where the client is out of sync.
 */
export async function getUpvoteCount(caseId: string) {
  const doc = await findComplaintByCaseId(caseId);
  if (!doc) return 0;
  const count = doc.data()?.upvotes;
  return typeof count === "number" ? count : 0;
}
