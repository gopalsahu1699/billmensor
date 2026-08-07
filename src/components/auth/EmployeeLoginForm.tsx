'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FormField } from '@/components/ui/form/FormField'
import { EmailInput, SmartInput } from '@/components/ui/form/smart-inputs'
import { validateEmail } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'

type EmployeeFormKey = 'email' | 'pin'

function fieldError(key: EmployeeFormKey, f: { email: string; pin: string }): string | undefined {
    switch (key) {
        case 'email':
            if (!f.email.trim()) return 'Please enter your email address.'
            return validateEmail(f.email) ?? undefined
        case 'pin':
            if (!f.pin) return 'Please enter your PIN.'
            if (!/^\d{6}$/.test(f.pin)) return 'PIN must be 6 digits.'
            return undefined
        default:
            return undefined
    }
}

export function EmployeeLoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        pin: '',
    })
    const [errors, setErrors] = useState<Partial<Record<EmployeeFormKey, string>>>({})

    const update = (key: EmployeeFormKey, value: string) => {
        setFormData((f) => ({ ...f, [key]: value }))
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: EmployeeFormKey) => {
        setErrors((e) => ({ ...e, [key]: fieldError(key, formData) ?? '' }))
    }

    const handleEmployeeLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors: Partial<Record<EmployeeFormKey, string>> = {}
        ;(['email', 'pin'] as EmployeeFormKey[]).forEach((key) => {
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
            // 1. Try to find the member in 'staff_members' (Hierarchy pattern)
            let { data: staff } = await supabase
                .from('staff_members')
                .select('*')
                .eq('login_email', formData.email)
                .eq('login_pin', formData.pin)
                .eq('status', 'active')
                .maybeSingle()

            // 2. Fallback to 'team_members' (Legacy pattern)
            if (!staff) {
                const { data: team } = await supabase
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
        } catch (error: unknown) {
            console.error('Login Error:', error)
            toast.error(friendlyError(error, 'Login failed. Please check your credentials.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleEmployeeLogin} noValidate className="space-y-4">
            <div className="space-y-4">
                <FormField label="Staff Email" required error={errors.email}>
                    {({ id, describedBy, invalid }) => (
                        <EmailInput
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            invalid={invalid}
                            placeholder="yourname@company.com"
                            required
                            className="bg-slate-50 focus:ring-blue-600/20"
                            value={formData.email}
                            onChange={(e) => update('email', e.target.value)}
                            onBlur={() => blurValidate('email')}
                        />
                    )}
                </FormField>
                <FormField label="Entry PIN" required error={errors.pin}>
                    {({ id, describedBy, invalid }) => (
                        <SmartInput
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            invalid={invalid}
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="••••••"
                            maxLength={6}
                            required
                            className="bg-slate-50 focus:ring-blue-600/20 text-lg tracking-[0.5em]"
                            value={formData.pin}
                            onChange={(e) => update('pin', e.target.value.replace(/\D/g, ''))}
                            onBlur={() => blurValidate('pin')}
                        />
                    )}
                </FormField>

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
