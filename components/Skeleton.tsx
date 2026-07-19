export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 rounded bg-elevated2" />
        <div className="h-5 w-16 rounded bg-elevated2" />
      </div>
      <div className="h-4 w-3/4 rounded bg-elevated2 mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-elevated2 mb-1.5"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="h-3 w-20 rounded bg-elevated2" />
        <div className="h-3 w-16 rounded bg-elevated2" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 border-b border-border py-3 px-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-elevated2" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border py-4 px-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3 flex-1 rounded bg-elevated2"
              style={{ opacity: 1 - c * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card text-center animate-pulse">
      <div className="h-3 w-16 mx-auto rounded bg-elevated2 mb-2" />
      <div className="h-8 w-12 mx-auto rounded bg-elevated2" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="rounded-none overflow-hidden border border-border animate-pulse">
      <div className="h-[450px] flex items-center justify-center bg-elevated">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-elevated2" />
          <div className="h-3 w-32 rounded bg-elevated2" />
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-20 rounded bg-elevated2 mb-2" />
        <div className="h-12 w-full rounded-md bg-elevated2" />
      </div>
      <div>
        <div className="h-3 w-24 rounded bg-elevated2 mb-2" />
        <div className="h-32 w-full rounded-md bg-elevated2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-3 w-16 rounded bg-elevated2 mb-2" />
          <div className="h-12 w-full rounded-md bg-elevated2" />
        </div>
        <div>
          <div className="h-3 w-16 rounded bg-elevated2 mb-2" />
          <div className="h-12 w-full rounded-md bg-elevated2" />
        </div>
      </div>
      <div className="h-14 w-full rounded-md bg-elevated2" />
    </div>
  );
}