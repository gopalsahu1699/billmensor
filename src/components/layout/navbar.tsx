'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MdSearch, MdNotifications, MdMenu } from 'react-icons/md'

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
    const [user, setUser] = useState<any | null>(null)
    const [notificationCount, setNotificationCount] = useState(0)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/notifications')
                if (!res.ok) return
                const data = await res.json()
                setNotificationCount(data.notifications?.length || 0)
            } catch {
                // silently fail
            }
        }
        fetchCount()
        const interval = setInterval(fetchCount, 60000)
        return () => clearInterval(interval)
    }, [])

    const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

    return (
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-6 flex-1">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95"
                >
                    <MdMenu size={22} strokeWidth={2.5} />
                </button>

                <div className="hidden sm:block relative group w-full max-w-md">
                    <MdSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search records, invoices, parties..."
                        className="w-full bg-slate-100/50 dark:bg-white/5 border border-transparent focus:border-blue-500/20 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-5">

                <Link href="/dashboard/notifications" className="hidden md:flex p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl relative transition-all group active:scale-95">
                    <MdNotifications size={22} strokeWidth={2} className="group-hover:text-blue-500 transition-colors" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                            {notificationCount}
                        </span>
                    )}
                </Link>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-4 cursor-pointer group p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-98">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-blue-500 transition-colors">{fullName}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">{user?.email ? 'Administrator' : 'Guest'}</p>
                    </div>
                    {user?.user_metadata?.avatar_url ? (
                        <div className="w-10 h-10 rounded-2xl bg-slate-200 bg-cover bg-center border border-slate-200 dark:border-white/10 shadow-sm transition-transform group-hover:scale-105"
                            style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }}>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 font-black transition-transform group-hover:scale-105">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
