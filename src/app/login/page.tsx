'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { EmployeeLoginForm } from '@/components/auth/EmployeeLoginForm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            if (error) throw error

            toast.success('Logged in successfully!')
            router.push('/dashboard')
        } catch (error: any) {
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
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

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500 mb-6 font-medium">Please choose your login type to continue.</p>

                    {/* Login Type Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                        <button
                            onClick={() => setLoginType('owner')}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                loginType === 'owner' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Business Owner
                        </button>
                        <button
                            onClick={() => setLoginType('employee')}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                loginType === 'employee' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Employee / Staff
                        </button>
                    </div>

                    {loginType === 'owner' ? (
                        <>
                            {/* Google Login Button — appears first for owners */}
                            <div className="mt-4">
                                <GoogleLoginButton />
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or login with email</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="block text-sm font-medium text-slate-700">Password</label>
                                        <Link href="/forgot-password" title="sm" className="text-sm text-blue-600 hover:underline">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full" isLoading={loading}>
                                    Login
                                </Button>
                            </form>
                        </>
                    ) : (
                        <EmployeeLoginForm />
                    )}

                    <div className="mt-8 text-center text-sm text-slate-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                            Sign Up
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
