import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "../../lib/firebaseClient";
import { LanternMark } from "../../components/SiteHeader";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "লগইন ব্যর্থ হয়েছে।");

      router.push("/admin");
    } catch (err) {
      setError(err.message?.includes("auth/") ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" : err.message || "লগইন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>মডারেটর লগইন — Nirbhoy</title></Head>
      <div className="flex min-h-screen items-center justify-center bg-lantern px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <LanternMark />
            <span className="font-display text-lg font-semibold text-text-primary">Nirbhoy</span>
            <span className="ml-1 font-mono text-xs text-text-faint">/ মডারেটর</span>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-5">
            <div>
              <label className="field-label" htmlFor="email">ইমেইল</label>
              <input
                id="email"
                type="email"
                required
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">পাসওয়ার্ড</label>
              <input
                id="password"
                type="password"
                required
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="font-body text-sm text-danger">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "লগইন হচ্ছে…" : "লগইন"}
            </button>
          </form>
          <p className="mt-6 text-center font-mono text-xs text-text-faint">
            শুধুমাত্র অনুমোদিত মডারেটরদের জন্য
          </p>
        </div>
      </div>
    </>
  );
}
