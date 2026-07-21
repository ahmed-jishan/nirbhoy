/**
 * Nirbhoy Skeleton Components
 * ---------------------------
 * Reusable loading placeholders that match the site's design system.
 * These use the `.skeleton` CSS class defined in globals.css.
 */

export function SkeletonBox({ className = "", height = "h-4", width = "w-full" }: {
  className?: string;
  height?: string;
  width?: string;
}) {
  return <div className={`skeleton ${height} ${width} ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-elevated/80 p-6 ${className}`}>
      {/* Header line */}
      <div className="flex items-center justify-between">
        <SkeletonBox width="w-32" height="h-3" />
        <SkeletonBox width="w-20" height="h-5" />
      </div>
      {/* Title */}
      <div className="mt-4">
        <SkeletonBox width="w-3/4" height="h-5" />
      </div>
      {/* Body text */}
      <div className="mt-3">
        <SkeletonText lines={2} />
      </div>
      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <SkeletonBox width="w-24" height="h-3" />
        <SkeletonBox width="w-16" height="h-3" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCaseDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Case ID + badge */}
      <div className="flex items-center gap-3">
        <SkeletonBox width="w-40" height="h-5" />
        <SkeletonBox width="w-24" height="h-6" />
      </div>
      {/* Title */}
      <SkeletonBox width="w-full" height="h-8" />
      <SkeletonBox width="w-2/3" height="h-8" />
      {/* Summary */}
      <div className="mt-4">
        <SkeletonText lines={4} />
      </div>
      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
        <SkeletonBox width="w-full" height="h-12" />
        <SkeletonBox width="w-full" height="h-12" />
      </div>
      {/* Action buttons */}
      <div className="flex gap-2">
        <SkeletonBox width="w-28" height="h-10" />
        <SkeletonBox width="w-28" height="h-10" />
      </div>
      {/* Timeline */}
      <div className="mt-8 border-t border-border pt-6">
        <SkeletonBox width="w-40" height="h-6" />
        <div className="mt-6 space-y-4">
          <SkeletonBox width="w-full" height="h-16" />
          <SkeletonBox width="w-full" height="h-16" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card text-center">
      <div className="flex flex-col items-center gap-2">
        <SkeletonBox width="w-20" height="h-3" />
        <SkeletonBox width="w-16" height="h-8" />
      </div>
    </div>
  );
}

export function SkeletonMap({ height = "h-[520px]" }: { height?: string }) {
  return (
    <div className={`rounded-md border border-border bg-elevated/60 ${height} flex items-center justify-center`}>
      <div className="text-center">
        <SkeletonBox width="w-8" height="h-8" className="rounded-full mx-auto" />
        <div className="mt-3">
          <SkeletonBox width="w-40" height="h-4" className="mx-auto" />
        </div>
      </div>
    </div>
  );
}