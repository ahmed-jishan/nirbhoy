import { useI18n } from "../lib/i18n";

/**
 * CaseTimeline — vertical timeline showing published updates for a case.
 *
 * Used on both the public /case/[caseId] page and the admin review panel
 * (with `showPrivate` true to include moderator-only updates).
 */

interface Update {
  id: string;
  title: string;
  message: string;
  type: string;
  isPublic: boolean;
  authorEmail: string | null;
  createdAt: string | null;
}

interface Props {
  updates: Update[];
  publishedAt: string | null;
  showPrivate?: boolean;
  onDelete?: (id: string) => void;
}

const TYPE_META: Record<string, { i18nKey: string; color: string; icon: string }> = {
  info: {
    i18nKey: "timeline.type.info",
    color: "border-border text-text-muted",
    icon: "ⓘ",
  },
  action: {
    i18nKey: "timeline.type.action",
    color: "border-accent/40 text-accent bg-accent-soft/40",
    icon: "→",
  },
  resolved: {
    i18nKey: "timeline.type.resolved",
    color: "border-accent/60 text-accent bg-accent-soft",
    icon: "✓",
  },
  escalated: {
    i18nKey: "timeline.type.escalated",
    color: "border-danger/40 text-danger bg-danger-soft/60",
    icon: "↑",
  },
};

export default function CaseTimeline({ updates, publishedAt, showPrivate = false, onDelete }: Props) {
  const { t, lang } = useI18n();
  const locale = lang === "bn" ? "bn-BD" : "en-US";

  if (updates.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-elevated/40 p-6 text-center">
        <p className="font-code text-sm text-text-muted">
          <span className="term-info">$</span> {t("timeline.empty")}
        </p>
        {publishedAt && (
          <p className="mt-2 font-terminal text-xs text-text-faint">
            {new Date(publishedAt).toLocaleDateString(locale)} — {t("timeline.publishedOn")}
          </p>
        )}
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l-2 border-border pl-6">
      {updates.map((u) => {
        const meta = TYPE_META[u.type] || TYPE_META.info;
        return (
          <li key={u.id} className="relative">
            {/* Timeline node */}
            <span
              className={`absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2 bg-bg font-terminal text-[11px] ${meta.color}`}
              aria-hidden="true"
            >
              {meta.icon}
            </span>

            <article className="rounded-md border border-border bg-elevated/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-none border px-2 py-0.5 font-terminal text-[10px] uppercase tracking-wider ${meta.color}`}
                  >
                    {t(meta.i18nKey)}
                  </span>
                  {showPrivate && !u.isPublic && (
                    <span className="rounded-none border border-borderStrong bg-elevated2 px-2 py-0.5 font-terminal text-[10px] uppercase tracking-wider text-text-faint">
                      {t("timeline.private")}
                    </span>
                  )}
                </div>
                <span className="font-terminal text-[10px] text-text-faint">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleString(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>
              </div>

              <h3 className="mt-2 font-display text-base font-medium text-text-primary">
                {u.title}
              </h3>
              <p className="mt-1 whitespace-pre-wrap font-code text-sm leading-relaxed text-text-muted">
                {u.message}
              </p>

              {showPrivate && u.authorEmail && (
                <p className="mt-3 border-t border-border pt-2 font-terminal text-[10px] text-text-faint">
                  $ {t("timeline.author")}: {u.authorEmail}
                </p>
              )}

              {showPrivate && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(u.id)}
                  className="mt-3 rounded-md border border-danger/40 px-2 py-1 font-terminal text-[10px] text-danger hover:bg-danger hover:text-bg transition-colors"
                >
                  {t("timeline.delete")}
                </button>
              )}
            </article>
          </li>
        );
      })}

      {/* Publication footer */}
      {publishedAt && (
        <li className="relative">
          <span
            className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-bg font-terminal text-[10px] text-accent"
            aria-hidden="true"
          >
            ●
          </span>
          <div className="font-terminal text-xs text-text-faint">
            $ {t("timeline.published")}: {new Date(publishedAt).toLocaleDateString(locale)}
          </div>
        </li>
      )}
    </ol>
  );
}
