'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/dashboard/settings/account')
    }, [router])

    return (
        <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )
}
