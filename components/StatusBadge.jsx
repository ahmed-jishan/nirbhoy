const LABELS = {
  pending: "অপেক্ষমাণ",
  reviewing: "যাচাই চলছে",
  published: "প্রকাশিত",
  rejected: "প্রত্যাখ্যাত",
};

export default function StatusBadge({ status }) {
  const cls =
    {
      pending: "badge-pending",
      reviewing: "badge-reviewing",
      published: "badge-published",
      rejected: "badge-rejected",
    }[status] || "badge-pending";

  return <span className={cls}>{LABELS[status] || status}</span>;
}
