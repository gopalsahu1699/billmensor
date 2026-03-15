'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'

interface GoogleLoginButtonProps {
    text?: string
}

export function GoogleLoginButton({ text = 'Continue with Google' }: GoogleLoginButtonProps) {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // IMPORTANT: Only render after mounting on the client to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            // Supabase `@supabase/ssr` with PKCE handles code verifiers in cookies automatically
            // when initiated from the client, provided the callback page fetches it correctly.
            if (error) throw error
        } catch (error: any) {
            toast.error(error.message || 'Failed to login with Google')
            setLoading(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all"
            onClick={handleGoogleLogin}
            isLoading={loading}
        >
            {!loading && <FcGoogle className="text-xl" />}
            {text}
        </Button>
    )
}
