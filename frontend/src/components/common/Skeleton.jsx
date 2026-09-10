import React from 'react';

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-[#364356]/60 rounded-md ${className}`}
      style={style}
    />
  );
}

/**
 * TableSkeleton component: renders realistic table rows while data is loading
 */
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100 dark:border-[#364356] hover:bg-slate-50/50 dark:hover:bg-[#2e394b]/40 transition-colors">
          {Array.from({ length: cols }).map((_, cIdx) => {
            // First column: often a code badge or checkbox + avatar
            if (cIdx === 0) {
              return (
                <td key={cIdx} className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="w-20 h-4 rounded" />
                      <Skeleton className="w-12 h-3 rounded" />
                    </div>
                  </div>
                </td>
              );
            }
            // Last column: action buttons
            if (cIdx === cols - 1) {
              return (
                <td key={cIdx} className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                  </div>
                </td>
              );
            }
            // Second to last column: often a status badge
            if (cIdx === cols - 2) {
              return (
                <td key={cIdx} className="px-4 py-3.5">
                  <Skeleton className="w-20 h-6 rounded-full" />
                </td>
              );
            }
            // Middle columns: varying width text lines
            const widths = ['w-28', 'w-36', 'w-24', 'w-32', 'w-20'];
            const chosenWidth = widths[(rIdx + cIdx) % widths.length];
            return (
              <td key={cIdx} className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <Skeleton className={`${chosenWidth} h-4 rounded`} />
                  {(rIdx + cIdx) % 2 === 0 && <Skeleton className="w-16 h-3 rounded" />}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/**
 * MobileCardSkeleton: renders card placeholders for mobile views
 */
export function MobileCardSkeleton({ count = 3 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-5 rounded" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="w-3/4 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Skeleton className="w-20 h-3 rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="w-14 h-6 rounded-lg" />
              <Skeleton className="w-14 h-6 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
