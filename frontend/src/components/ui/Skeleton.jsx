import { motion } from 'framer-motion';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`bg-slate-200 animate-pulse rounded-md ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full w-full flex flex-col">
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-10 w-24 mb-4" />
    <Skeleton className="h-4 w-48 mt-auto" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
    <div className="p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full w-full">
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div>
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="w-full h-48 rounded-xl" />
  </div>
);
