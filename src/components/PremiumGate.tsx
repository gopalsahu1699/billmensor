'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MdLock } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PremiumGateProps {
    children: React.ReactNode
}

export default function PremiumGate({ children }: PremiumGateProps) {
    const [isPremium, setIsPremium] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        async function check() {
            try {
                const { data: userData } = await supabase.auth.getUser()
                if (!userData.user) { setChecking(false); return }
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_type, plan_expiry, plan_status')
                    .eq('id', userData.user.id)
                    .limit(1)
                const prof = profile?.[0]
                const active = prof?.plan_type && prof.plan_type !== 'free'
                    && prof.plan_status === 'active'
                    && (!prof.plan_expiry || new Date(prof.plan_expiry) >= new Date())
                setIsPremium(!!active)
            } catch { setIsPremium(false) }
            finally { setChecking(false) }
        }
        check()
    }, [])

    if (checking) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="material-symbols-outlined animate-spin text-primary text-[48px]">sync</span>
            </div>
        )
    }

    if (!isPremium) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <MdLock className="text-white w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase">Premium Feature</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                    Upgrade to unlock advanced reports and analytics for your business.
                </p>
                <Link href="/dashboard/settings/billing">
                    <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                        Upgrade Now
                    </Button>
                </Link>
            </div>
        )
    }

    return <>{children}</>
}
