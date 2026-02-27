export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
                    <span className="text-white font-black text-2xl italic">B</span>
                </div>
                <div className="h-2 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
        </div>
    )
}
