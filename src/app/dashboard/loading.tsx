export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                ))}
            </div>
            {/* Table skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
