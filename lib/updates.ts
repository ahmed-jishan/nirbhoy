import { adminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";

/**
 * Case Timeline / Updates
 * -----------------------
 * Each complaint can accumulate a series of "updates" written by admins.
 * Updates are stored as a subcollection at:  complaints/{id}/updates/{updateId}
 *
 * There are two flavours of updates:
 *   - public  → visible on the public case timeline (readonly to visitors)
 *   - private → moderator-only working notes; never leaves the admin panel
 *
 * The `type` field is a semantic tag used purely for UI (colour + icon):
 *   info      — general status information
 *   action    — an action was taken (forwarded to authority, etc.)
 *   resolved  — the case has been resolved / closed
 *   escalated — the case was escalated to a higher authority
 */

const COMPLAINTS = "complaints";
const UPDATES = "updates";

export const UPDATE_TYPES = ["info", "action", "resolved", "escalated"] as const;
export type UpdateType = (typeof UPDATE_TYPES)[number];

export interface CaseUpdate {
  id: string;
  title: string;
  message: string;
  type: UpdateType;
  isPublic: boolean;
  authorEmail: string | null;
  createdAt: string | null;
}

export interface CreateUpdateInput {
  complaintId: string;
  title: string;
  message: string;
  type: UpdateType;
  isPublic: boolean;
  authorEmail?: string | null;
}

const MAX_TITLE = 140;
const MAX_MESSAGE = 2000;

/**
 * Add a new update to a complaint. Called from admin PATCH endpoints only.
 */
export async function addComplaintUpdate(input: CreateUpdateInput) {
  const db = adminDb();

  if (!input.complaintId) throw new Error("complaintId is required");
  if (!input.title || input.title.trim().length < 3) {
    throw new Error("Update title must be at least 3 characters.");
  }
  if (!input.message || input.message.trim().length < 5) {
    throw new Error("Update message must be at least 5 characters.");
  }
  if (input.title.length > MAX_TITLE) {
    throw new Error(`Title must be under ${MAX_TITLE} characters.`);
  }
  if (input.message.length > MAX_MESSAGE) {
    throw new Error(`Message must be under ${MAX_MESSAGE} characters.`);
  }
  if (!UPDATE_TYPES.includes(input.type)) {
    throw new Error("Invalid update type.");
  }

  // Make sure the parent complaint actually exists — avoids stray subdocs.
  const parent = await db.collection(COMPLAINTS).doc(input.complaintId).get();
  if (!parent.exists) throw new Error("Complaint not found.");

  const doc = {
    title: input.title.trim(),
    message: input.message.trim(),
    type: input.type,
    isPublic: Boolean(input.isPublic),
    authorEmail: input.authorEmail || null,
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await db
    .collection(COMPLAINTS)
    .doc(input.complaintId)
    .collection(UPDATES)
    .add(doc);

  // Bump the parent's updatedAt so admin listings pick up recent activity.
  await db
    .collection(COMPLAINTS)
    .doc(input.complaintId)
    .update({ updatedAt: FieldValue.serverTimestamp() });

  return { id: ref.id };
}

/**
 * Fetch all updates for a complaint. `visibility` filter is critical:
 *   - "public"  → for the public /case/[caseId] page
 *   - "all"     → for the admin review panel
 */
export async function listComplaintUpdates(
  complaintId: string,
  visibility: "public" | "all" = "public"
): Promise<CaseUpdate[]> {
  const db = adminDb();
  try {
    // Firestore composite indexes are annoying; do a simple query
    // and sort/filter in memory. The update volume per case is small.
    const snap = await db
      .collection(COMPLAINTS)
      .doc(complaintId)
      .collection(UPDATES)
      .get();

    const items: CaseUpdate[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || "",
        message: d.message || "",
        type: (UPDATE_TYPES.includes(d.type) ? d.type : "info") as UpdateType,
        isPublic: Boolean(d.isPublic),
        authorEmail: d.authorEmail || null,
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
      };
    });

    const filtered = visibility === "public" ? items.filter((u) => u.isPublic) : items;

    // Newest first.
    return filtered.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  } catch (err: any) {
    logger.warn({ err: String(err?.message || err), complaintId }, "listComplaintUpdates failed");
    return [];
  }
}

/**
 * Delete an update — admin only. Returns true if removed.
 */
export async function deleteComplaintUpdate(complaintId: string, updateId: string) {
  const db = adminDb();
  const ref = db
    .collection(COMPLAINTS)
    .doc(complaintId)
    .collection(UPDATES)
    .doc(updateId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/**
 * Get a complaint's public-facing summary + published updates, keyed by
 * caseId (not internal doc id). Used by the public /case/[caseId] page.
 * Returns null if the complaint isn't published yet.
 */
export async function getPublicCaseByCaseId(caseId: string) {
  const db = adminDb();
  const snap = await db
    .collection(COMPLAINTS)
    .where("caseId", "==", caseId)
    .limit(1)
    .get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const d = doc.data();

  // Only expose published cases publicly.
  if (d.status !== "published") return null;

  const updates = await listComplaintUpdates(doc.id, "public");

  // Only expose proofs on the public page if admin explicitly opted in
  const proofsVisible = Boolean(d.proofsVisible);
  let proofs = [];
  if (proofsVisible && Array.isArray(d.proofs) && d.proofs.length > 0) {
    proofs = d.proofs.map((p: any) => ({
      publicId: p.publicId,
      resourceType: p.resourceType || "image",
    }));
  }

  return {
    id: doc.id,
    caseId: d.caseId,
    type: d.type,
    title: d.publicTitle || d.title,
    summary: d.publicSummary || "",
    location: d.location || "",
    lat: typeof d.lat === "number" ? d.lat : null,
    lng: typeof d.lng === "number" ? d.lng : null,
    locationPrecision: d.locationPrecision || "district",
    status: d.status,
    upvotes: typeof d.upvotes === "number" ? d.upvotes : 0,
    publishedAt: d.publishedAt ? d.publishedAt.toDate().toISOString() : null,
    proofsVisible,
    proofs,
    updates,
  };
}
