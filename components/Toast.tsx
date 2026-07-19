import { useState, useEffect, useCallback, createContext, useContext } from "react";

// Toast context
const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, "success", dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, "error", dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, "info", dur), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const bgColor = {
    success: "border-accent/30 bg-accent-soft/90",
    error: "border-danger/40 bg-danger-soft/90",
    info: "border-borderStrong bg-elevated/90",
  }[toast.type] || "bg-elevated/90 border-border";

  const iconColor = {
    success: "text-accent",
    error: "text-danger",
    info: "text-text-muted",
  }[toast.type] || "text-text-muted";

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  }[toast.type] || "ℹ";

  return (
    <div
      className={`rounded-md border ${bgColor} backdrop-blur-md px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`font-terminal text-sm ${iconColor}`}>{icon}</span>
        <p className="font-body text-sm text-text-primary flex-1">{toast.message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-text-faint hover:text-text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}