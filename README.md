# Nirbhoy (নির্ভয়)

Anonymous civic complaint & whistleblower platform. People submit reports
without giving their name; a moderator reviews each one before anything
public appears, so raw accusations never go straight to a public feed.

Stack: **Next.js (Pages Router)** · **Firebase** (Firestore + Auth, free
Spark plan) · **Cloudinary** (private proof file storage, free tier) ·
deploys to **Vercel** (free tier).

---

## 1. Firebase setup

1. Create a project at https://console.firebase.google.com (free Spark plan is enough).
2. **Build → Firestore Database → Create database** (start in production mode — the app never talks to Firestore from the browser, so the locked-down `firestore.rules` in this repo is all you need. Deploy it with the Firebase CLI: `firebase deploy --only firestore:rules`, or paste it into the Firestore Rules tab in the console).
3. **Build → Authentication → Sign-in method → Email/Password → Enable.**
4. **Project settings (gear icon) → General** — under "Your apps", add a Web app. Copy the `apiKey`, `authDomain`, `projectId` into `.env.local` as the `NEXT_PUBLIC_FIREBASE_*` values.
5. **Project settings → Service accounts → Generate new private key.** Open the downloaded JSON and copy `project_id`, `client_email`, `private_key` into `.env.local` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` sequences exactly as-is).

## 2. Cloudinary setup

1. Create a free account at https://cloudinary.com.
2. From the Dashboard, copy **Cloud name**, **API Key**, **API Secret** into `.env.local` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Nothing else to configure — uploads are signed server-side and stored as `type=authenticated`, so files are never publicly reachable by URL. Only the admin panel can generate a link, and that link expires after 5 minutes.

## 3. Local setup

```bash
cp .env.example .env.local
# fill in the values from steps 1–2 above
npm install
npm run create-admin   # reads NIRBHOY_ADMIN_EMAIL / NIRBHOY_ADMIN_PASSWORD from .env.local
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` for the moderator panel.

To add more moderators later, either rerun `create-admin` with a different
`NIRBHOY_ADMIN_EMAIL` in `.env.local`, or manually add a user in Firebase
Auth and add a matching document to the Firestore `admins` collection
(document ID = that user's UID).

## 4. Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import it in Vercel (https://vercel.com/new).
3. In **Project → Settings → Environment Variables**, add every key from `.env.example` (same values as your `.env.local`).
4. Deploy. Vercel's free tier is enough — this app stores no files on disk, so it works fine on serverless functions.

## How the anonymity/safety model works

- No name, phone number, or account is ever collected from someone submitting a report.
- Every submission gets a case ID (`NRB-2026-00001`) so the submitter can check status later without logging in.
- Nothing reaches the public feed until a moderator reviews it and writes a name-free public summary — this is the main safeguard against false accusations and mob-justice risk.
- Proof files upload directly from the browser straight to Cloudinary (signed, `type=authenticated`) — they never pass through the app server, and are never publicly viewable. Only a logged-in moderator can generate a 5-minute viewing link.
- Firestore is fully locked down (`firestore.rules` denies all client reads/writes) — the app only ever talks to Firestore server-side via the Firebase Admin SDK.

## Known limitations / next steps to harden further

- There's no rate-limiting on submissions yet — worth adding (e.g. Vercel's edge config or a Cloudflare Turnstile captcha on `/submit`) before a public launch, to slow down spam/abuse.
- Consider adding a second-moderator approval step before publishing anything in the "incident" category, given the stakes.
- For real deployments, review Bangladesh's Digital Security Act / Cyber Security Act implications with a lawyer before launch — hosting user-submitted allegations carries legal exposure even with moderation in place.
