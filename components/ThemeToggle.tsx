import { useTheme } from "../lib/theme";

/**
 * ThemeToggle — compact sun/moon icon toggle for light/dark mode.
 * Uses the same styling language as LanguageToggle for consistency.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
      title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
      className={`inline-flex items-center justify-center rounded-md border border-borderStrong bg-elevated/80 px-2.5 py-1.5 font-terminal text-xs text-text-muted hover:text-accent hover:border-accent/40 transition-all duration-200 ${className}`}
    >
      {theme === "dark" ? (
        /* Sun icon for switching to light mode */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M12.95 3.05L11.54 4.46M4.46 11.54L3.05 12.95" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ) : (
        /* Moon icon for switching to dark mode */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1">
          <path d="M12.5 10.5C10.5 10.5 6 9 6 4.5C6 3.5 6.5 2 7.5 1C4.5 1.5 1 4.5 1 8.5C1 12.5 4 15 8 15C11.5 15 14 12 14.5 9.5C13.5 10 13 10.5 12.5 10.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      )}
      <span>{theme === "dark" ? "লাইট" : "ডার্ক"}</span>
    </button>
  );
}