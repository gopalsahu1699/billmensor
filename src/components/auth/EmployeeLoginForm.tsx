'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function EmployeeLoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        pin: '',
    })

    const handleEmployeeLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Try to find the member in 'staff_members' (Hierarchy pattern)
            let { data: staff, error: staffError } = await supabase
                .from('staff_members')
                .select('*')
                .eq('login_email', formData.email)
                .eq('login_pin', formData.pin)
                .eq('status', 'active')
                .maybeSingle()

            // 2. Fallback to 'team_members' (Legacy pattern)
            if (!staff) {
                const { data: team, error: teamError } = await supabase
                    .from('team_members')
                    .select('*')
                    .eq('email', formData.email)
                    .eq('pin', formData.pin)
                    .eq('status', 'active')
                    .maybeSingle()
                
                staff = team // Use whatever was found
            }

            if (!staff) {
                throw new Error('Invalid credentials or account disabled.')
            }

            // 3. Authenticate with Supabase
            // We use the email and PIN as password (admin sets this up)
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.pin,
            })

            if (authError) throw authError

            toast.success('Access Granted! Welcome back.')
            router.push('/dashboard')
        } catch (error: any) {
            console.error('Login Error:', error)
            toast.error(error.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleEmployeeLogin} className="space-y-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Staff Email</label>
                    <Input
                        type="email"
                        placeholder="yourname@company.com"
                        required
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-600/20"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Entry PIN</label>
                    <Input
                        type="password"
                        placeholder="••••"
                        required
                        maxLength={6}
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-600/20 text-lg tracking-[0.5em]"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    />
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2" 
                    isLoading={loading}
                >
                    Access Portal
                </Button>
                
                <p className="text-[10px] text-center text-slate-400 italic">
                    Contact your administrator if you forgot your PIN
                </p>
            </div>
        </form>
    )
}
