'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
    ArrowLeft,
    Wallet,
    Calendar,
    Tag,
    FileText,
    Trash2,
    Edit,
    Loader2,
    IndianRupee,
    Hash
} from 'lucide-react'

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [expense, setExpense] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchExpense()
    }, [id])

    async function fetchExpense() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setExpense(data)
        } catch (error: any) {
            toast.error('Failed to load expense details')
            router.push('/dashboard/expenses')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this expense record?')) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Expense record deleted')
            router.push('/dashboard/expenses')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-red-600 w-10 h-10" />
            <p className="text-slate-500 font-medium tracking-tight">Loading expense record...</p>
        </div>
    )

    if (!expense) return null

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Business Expenditure</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{expense.category || 'General'}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">{expense.title}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/expenses/create?edit=${id}`)}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit size={18} /> Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-red-50 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Trash2 size={18} /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <Card className="md:col-span-2 border-none shadow-2xl rounded-[40px] overflow-hidden">
                    <div className="bg-slate-900 p-12 text-white flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30">
                            <Wallet size={40} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Transaction Value</p>
                            <h2 className="text-6xl font-black italic tracking-tighter">₹{expense.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                        </div>
                    </div>
                    <CardContent className="p-12 space-y-10 bg-white">
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Date</p>
                                <div className="flex items-center gap-2 text-slate-900 font-black italic">
                                    <Calendar size={16} className="text-red-500" />
                                    {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Tag</p>
                                <div className="flex items-center gap-2 text-slate-900 font-black italic">
                                    <Tag size={16} className="text-red-500" />
                                    <span className="uppercase">{expense.category || 'General Spending'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-slate-50 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileText size={14} className="text-red-500" /> Description & Notes
                            </p>
                            <p className="text-slate-600 leading-relaxed italic text-lg font-medium">
                                {expense.description || 'No additional description provided for this expense.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-black text-slate-400">Audit Trail</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-1 h-full absolute left-4 bg-slate-100"></div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 relative">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 z-10"></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Created At</p>
                                            <p className="text-xs font-bold text-slate-700">{new Date(expense.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 relative">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 z-10"></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voucher Ref</p>
                                            <p className="text-xs font-bold text-slate-700 italic">Self Recorded</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-none shadow-sm shadow-red-100">
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 italic">Budget Impact</p>
                            <p className="text-sm text-red-800 leading-relaxed font-medium italic">
                                This record represents a direct outflow of capital from your operational budget.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
