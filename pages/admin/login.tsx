import { useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "../../lib/firebaseClient";
import { LanternMark } from "../../components/SiteHeader";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const idTokenRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      idTokenRef.current = idToken;

      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();

      // If 2FA is required, show the TOTP input step
      if (res.status === 400 && data.error === "totp_required") {
        setShowTotp(true);
        setError("");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || "লগইন ব্যর্থ হয়েছে।");

      router.push("/admin");
    } catch (err) {
      setError(err.message?.includes("auth/") ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" : err.message || "লগইন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: idTokenRef.current, totpCode: totpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "কোড সঠিক নয়।");
      router.push("/admin");
    } catch (err) {
      setError(err.message || "দুই-স্তর যাচাইকরণ ব্যর্থ হয়েছে।");
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

          {!showTotp ? (
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
          ) : (
            <form onSubmit={handleTotpSubmit} className="card space-y-5">
              <div className="text-center">
                <p className="font-terminal text-xs text-text-muted mb-1">$ দুই-স্তর যাচাইকরণ</p>
                <p className="font-code text-sm text-text-primary">আপনার অথেন্টিকেটর অ্যাপ থেকে কোড দিন</p>
              </div>
              <div>
                <label className="field-label" htmlFor="totpCode">৬-ডিজিটের কোড</label>
                <input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="field-input text-center text-2xl tracking-[0.5em] font-mono"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="______"
                  autoFocus
                />
              </div>
              {error && <p className="font-body text-sm text-danger">{error}</p>}
              <button className="btn-primary w-full" disabled={loading || totpCode.length < 6}>
                {loading ? "যাচাই করা হচ্ছে…" : "যাচাই করুন"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center font-mono text-xs text-text-faint">
            শুধুমাত্র অনুমোদিত মডারেটরদের জন্য
          </p>
        </div>
      </div>
    </>
  );
}
