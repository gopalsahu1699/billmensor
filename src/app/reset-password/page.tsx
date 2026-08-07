'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FormField } from '@/components/ui/form/FormField'
import { SmartInput } from '@/components/ui/form/smart-inputs'
import { friendlyError } from '@/lib/friendly-errors'

type ResetFormKey = 'password' | 'confirmPassword'

function fieldError(key: ResetFormKey, f: { password: string; confirmPassword: string }): string | undefined {
    switch (key) {
        case 'password':
            if (!f.password) return 'Please enter a new password.'
            if (f.password.length < 8) return 'Password must be at least 8 characters.'
            return undefined
        case 'confirmPassword':
            if (!f.confirmPassword) return 'Please confirm your new password.'
            if (f.confirmPassword !== f.password) return 'Passwords do not match.'
            return undefined
        default:
            return undefined
    }
}

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isValidToken, setIsValidToken] = useState(true)
    const [errors, setErrors] = useState<Partial<Record<ResetFormKey, string>>>({})

    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (!accessToken || type !== 'recovery') {
            setIsValidToken(false)
        } else {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || '',
            })
        }
    }, [])

    const update = (key: ResetFormKey, value: string) => {
        if (key === 'password') setPassword(value)
        else setConfirmPassword(value)
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: ResetFormKey) => {
        const form = { password, confirmPassword }
        setErrors((e) => ({ ...e, [key]: fieldError(key, form) ?? '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = { password, confirmPassword }
        const validationErrors: Partial<Record<ResetFormKey, string>> = {}
        ;(['password', 'confirmPassword'] as ResetFormKey[]).forEach((key) => {
            const msg = fieldError(key, form)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({ password })

            if (error) throw error

            toast.success('Password reset successfully!')
            router.push('/login')
        } catch (error: unknown) {
            toast.error(friendlyError(error, 'Failed to reset password'))
        } finally {
            setLoading(false)
        }
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
                    <p className="text-slate-500 mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link href="/forgot-password">
                        <Button className="w-full">
                            Request New Link
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Form */}
                <div className="w-full md:w-1/2 p-8 lg:p-12">
                    <div className="mb-10">
                        <Link href="/">
                            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl"></div>
                                Billmensor
                            </div>
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Set new password</h1>
                    <p className="text-slate-500 mb-8">Your new password must be different from previously used passwords.</p>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <FormField label="New Password" required error={errors.password} hint="Must be at least 8 characters">
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => update('password', e.target.value)}
                                    onBlur={() => blurValidate('password')}
                                />
                            )}
                        </FormField>
                        <FormField label="Confirm Password" required error={errors.confirmPassword}>
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => update('confirmPassword', e.target.value)}
                                    onBlur={() => blurValidate('confirmPassword')}
                                />
                            )}
                        </FormField>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Reset Password
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Right Side: Quote/Branding */}
                <div className="hidden md:flex md:w-1/2 bg-blue-600 p-12 text-white flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full -ml-32 -mb-32 opacity-20"></div>

                    <div className="relative z-10">
                        <div className="text-4xl font-bold mb-6">Billmensor</div>
                        <p className="text-blue-100 text-lg leading-relaxed mb-8">
                            Manage your complete business with Billmensor. Best software for billing, inventory & accounting.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span>Simple & Secure</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span>Fast & Reliable</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span>Cloud Sync</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
