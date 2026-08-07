'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { cn } from "../../lib/utils"
import { IoCloud, IoClose } from 'react-icons/io5'
import { MdCloudOff } from 'react-icons/md'
import Link from 'next/link'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [profile, setProfile] = useState<{ plan_type: string | null; plan_status: string | null; plan_expiry: string | null } | null>(null)
    const [bannerDismissed, setBannerDismissed] = useState(false)

    const fetchProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('plan_type, plan_status, plan_expiry')
                    .eq('id', user.id)
                    .single()
                if (data) setProfile(data)
            }
        } catch {
            // silently fail
        }
    }, [])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/login')
            } else {
                setLoading(false)
                fetchProfile()
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router, fetchProfile])

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const isPremium = profile?.plan_type && profile.plan_type !== 'free' && profile.plan_status === 'active'
    const isFree = !isPremium

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">
            {/* Sidebar with Mobile Support */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                showMobileMenu={showMobileMenu}
                setShowMobileMenu={setShowMobileMenu}
            />

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300 min-w-0",
                isCollapsed ? "lg:ml-20" : "lg:ml-64",
                "ml-0"
            )}>
                <Navbar onMenuClick={() => setShowMobileMenu(!showMobileMenu)} />

                {/* Subscription Banner */}
                {isFree && (
                    <div className="mx-4 sm:mx-8 lg:mx-12 mt-4 flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-5 py-3.5">
                        <MdCloudOff className="text-amber-600 dark:text-amber-400 shrink-0" size={22} />
                        <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-200">
                            You are on the Free plan &mdash; data is stored locally.
                        </p>
                        <Link
                            href="/dashboard/settings/billing"
                            className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            Upgrade
                        </Link>
                    </div>
                )}
                {isPremium && !bannerDismissed && (
                    <div className="mx-4 sm:mx-8 lg:mx-12 mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-3.5">
                        <IoCloud className="text-emerald-600 dark:text-emerald-400 shrink-0" size={22} />
                        <p className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Cloud backup active — expires {profile?.plan_expiry ? new Date(profile.plan_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                        <button
                            onClick={() => setBannerDismissed(true)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors text-emerald-600 dark:text-emerald-400"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>
                )}

                <main className="p-4 sm:p-8 lg:p-12 overflow-x-hidden">
                    {children}
                </main>
            </div>

            {/* Mobile Backdrop Overlay */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}
        </div>
    )
}
