'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { cn } from "../../lib/utils"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/login')
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

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
                "flex-1 flex flex-col transition-all duration-300 min-w-0", // min-w-0 helps with grid blowouts
                isCollapsed ? "lg:ml-20" : "lg:ml-64",
                "ml-0" // No margin on mobile
            )}>
                <Navbar onMenuClick={() => setShowMobileMenu(!showMobileMenu)} />
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


