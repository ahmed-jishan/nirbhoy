import { adminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const COMPLAINTS = "complaints";
const COUNTERS = "counters";

export const STATUSES = ["pending", "reviewing", "published", "rejected"];

// Atomically increments a per-year counter and returns a case ID like
// NRB-2026-00001. A transaction avoids two simultaneous submitters getting
// the same number.
async function generateCaseId() {
  const db = adminDb();
  const year = new Date().getFullYear();
  const counterRef = db.collection(COUNTERS).doc(`complaints_${year}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists ? snap.data().count : 0) + 1;
    tx.set(counterRef, { count: next }, { merge: true });
    return `NRB-${year}-${String(next).padStart(5, "0")}`;
  });
}

export async function createComplaint(input) {
  const db = adminDb();
  const caseId = await generateCaseId();

  const doc = {
    caseId,
    type: input.type, // "incident" | "grievance"
    title: input.title,
    description: input.description,
    location: input.location || "",
    proofs: input.proofs || [], // array of { publicId, resourceType }
    status: "pending",
    publicTitle: null,
    publicSummary: null,
    rejectionReason: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: null,
  };

  const ref = await db.collection(COMPLAINTS).add(doc);
  return { id: ref.id, caseId };
}

export async function getComplaintStatusByCaseId(caseId) {
  const db = adminDb();
  const snap = await db.collection(COMPLAINTS).where("caseId", "==", caseId).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    caseId: d.caseId,
    status: d.status,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
  };
}

export async function listPublishedComplaints({ type = null } = {}) {
  const db = adminDb();
  let q = db.collection(COMPLAINTS).where("status", "==", "published");
  if (type) q = q.where("type", "==", type);
  const snap = await q.get();
  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        caseId: d.caseId,
        type: d.type,
        title: d.publicTitle || d.title,
        summary: d.publicSummary || "",
        location: d.location,
        lat: d.lat || null,
        lng: d.lng || null,
        publishedAt: d.publishedAt ? d.publishedAt.toDate().toISOString() : null,
      };
    })
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 200);
}

export async function listComplaintsForAdmin({ status = null } = {}) {
  const db = adminDb();
  let q = db.collection(COMPLAINTS);
  if (status && status !== "all") q = q.where("status", "==", status);
  const snap = await q.get();
  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        caseId: d.caseId,
        type: d.type,
        title: d.title,
        status: d.status,
        location: d.location,
        hasProof: Array.isArray(d.proofs) ? d.proofs.length > 0 : Boolean(d.proofPublicId),
        proofCount: Array.isArray(d.proofs) ? d.proofs.length : (d.proofPublicId ? 1 : 0),
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
      };
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 300);
}

export async function getComplaintById(id) {
  const db = adminDb();
  const doc = await db.collection(COMPLAINTS).doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data();
  return {
    id: doc.id,
    caseId: d.caseId,
    type: d.type,
    title: d.title,
    description: d.description,
    location: d.location,
    proofs: d.proofs || (d.proofPublicId ? [{ publicId: d.proofPublicId, resourceType: d.proofResourceType || "image" }] : []),
    status: d.status,
    publicTitle: d.publicTitle,
    publicSummary: d.publicSummary,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
    publishedAt: d.publishedAt ? d.publishedAt.toDate().toISOString() : null,
  };
}

export async function updateComplaintStatus(id, { status, publicTitle, publicSummary, rejectionReason }) {
  const db = adminDb();
  const ref = db.collection(COMPLAINTS).doc(id);
  const update = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (status === "published") {
    update.publicTitle = publicTitle || null;
    update.publicSummary = publicSummary || null;
    update.publishedAt = FieldValue.serverTimestamp();
    update.rejectionReason = null;
  } else if (status === "rejected") {
    update.rejectionReason = rejectionReason || null;
  } else if (status === "reviewing") {
    // no extra fields
  }
  await ref.update(update);
  return getComplaintById(id);
}