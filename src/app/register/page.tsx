'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { toast } from 'sonner'
import { FormField } from '@/components/ui/form/FormField'
import { EmailInput, SmartInput } from '@/components/ui/form/smart-inputs'
import { validateEmail } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'

type RegisterFormKey = 'name' | 'email' | 'password'

function fieldError(key: RegisterFormKey, f: { name: string; email: string; password: string }): string | undefined {
    switch (key) {
        case 'name':
            return f.name.trim() ? undefined : 'Please enter your name.'
        case 'email':
            if (!f.email.trim()) return 'Please enter your email address.'
            return validateEmail(f.email) ?? undefined
        case 'password':
            if (!f.password) return 'Please enter a password.'
            if (f.password.length < 8) return 'Password must be at least 8 characters.'
            return undefined
        default:
            return undefined
    }
}

export default function RegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<Partial<Record<RegisterFormKey, string>>>({})

    // Coupon state
    const [couponCode, setCouponCode] = useState<string | null>(null)
    const [couponValid, setCouponValid] = useState(false)
    const [couponPlanType, setCouponPlanType] = useState<string | null>(null)
    const [couponChecking, setCouponChecking] = useState(false)

    // Read coupon from URL and validate
    useEffect(() => {
        const code = searchParams.get('coupon')
        if (code) {
            setCouponCode(code)
            setCouponChecking(true)
            fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.valid) {
                        setCouponValid(true)
                        setCouponPlanType(data.plan_type)
                    } else {
                        setCouponValid(false)
                    }
                })
                .catch(() => setCouponValid(false))
                .finally(() => setCouponChecking(false))
        }
    }, [searchParams])

    const update = (key: RegisterFormKey, value: string) => {
        setFormData((f) => ({ ...f, [key]: value }))
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: RegisterFormKey) => {
        setErrors((e) => ({ ...e, [key]: fieldError(key, formData) ?? '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors: Partial<Record<RegisterFormKey, string>> = {}
        ;(['name', 'email', 'password'] as RegisterFormKey[]).forEach((key) => {
            const msg = fieldError(key, formData)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    },
                },
            })

            if (error) throw error

            // If coupon was applied, redeem it after successful signup
            if (couponCode && couponValid && data.user) {
                try {
                    const redeemRes = await fetch('/api/coupons/redeem', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: couponCode }),
                    })
                    const redeemData = await redeemRes.json()
                    if (redeemRes.ok && redeemData.success) {
                        toast.success(`Account created! Coupon redeemed — you have the ${redeemData.plan_type} plan.`)
                    } else {
                        toast.success('Account created! Please check your email for verification.')
                    }
                } catch {
                    toast.success('Account created! Please check your email for verification.')
                }
            } else {
                toast.success('Account created! Please check your email for verification.')
            }
            router.push('/login')
        } catch (error: unknown) {
            toast.error(friendlyError(error, 'Failed to create account'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 lg:p-12">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <div className="text-2xl font-bold text-blue-600 inline-flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                            Billmensor
                        </div>
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Create an account</h1>
                <p className="text-slate-500 mb-6 text-center font-medium">Start managing your business inventory and billing today.</p>

                {/* Coupon Banner */}
                {couponCode && (
                    <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${
                        couponChecking
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : couponValid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                        {couponChecking ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 shrink-0"></div>
                                <span>Checking coupon <span className="font-mono font-bold">{couponCode}</span>...</span>
                            </>
                        ) : couponValid ? (
                            <>
                                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Coupon <span className="font-mono font-bold">{couponCode}</span> applied! You&apos;ll get <span className="font-bold">{couponPlanType}</span> after registration.</span>
                            </>
                        ) : (
                            <span>Coupon <span className="font-mono font-bold">{couponCode}</span> is invalid or expired.</span>
                        )}
                    </div>
                )}

                {/* Google Sign Up Button — appears first */}
                <div className="mt-4">
                    <GoogleLoginButton text="Sign up with Google" />
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Or sign up with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <FormField label="Full Name" required error={errors.name}>
                        {({ id, describedBy, invalid }) => (
                            <SmartInput
                                id={id}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                invalid={invalid}
                                placeholder="John Doe"
                                transform="words"
                                trimOnBlur
                                required
                                autoComplete="name"
                                value={formData.name}
                                onChange={(e) => update('name', e.target.value)}
                                onBlur={() => blurValidate('name')}
                            />
                        )}
                    </FormField>

                    <FormField label="Email Address" required error={errors.email}>
                        {({ id, describedBy, invalid }) => (
                            <EmailInput
                                id={id}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                invalid={invalid}
                                placeholder="name@company.com"
                                required
                                value={formData.email}
                                onChange={(e) => update('email', e.target.value)}
                                onBlur={() => blurValidate('email')}
                            />
                        )}
                    </FormField>

                    <FormField label="Password" required error={errors.password} hint="Must be at least 8 characters">
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
                                value={formData.password}
                                onChange={(e) => update('password', e.target.value)}
                                onBlur={() => blurValidate('password')}
                            />
                        )}
                    </FormField>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Create Account
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
