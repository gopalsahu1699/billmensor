'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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

            toast.success('Account created! Please check your email for verification.')
            router.push('/login')
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account')
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
                <p className="text-slate-500 mb-8 text-center">Start managing your business inventory and billing today.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <Input
                            type="text"
                            placeholder="John Doe"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters long.</p>
                    </div>

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
