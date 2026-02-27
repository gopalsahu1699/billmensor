'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [emailSent, setEmailSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)

            if (error) throw error

            setEmailSent(true)
            toast.success('Password reset link sent to your email!')
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset link')
        } finally {
            setLoading(false)
        }
    }

    if (emailSent) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 p-8 lg:p-12">
                        <div className="mb-10">
                            <Link href="/">
                                <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-xl"></div>
                                    Billmensor
                                </div>
                            </Link>
                        </div>

                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
                            <p className="text-slate-500 mb-6">
                                We&apos;ve sent a password reset link to <span className="font-medium text-slate-700">{email}</span>
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                Didn&apos;t receive the email? Check your spam folder or{' '}
                                <button onClick={() => setEmailSent(false)} className="text-blue-600 hover:underline">
                                    try again
                                </button>
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </div>

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

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot your password?</h1>
                    <p className="text-slate-500 mb-8">No worries, we&apos;ll send you reset instructions.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <Input
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

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
