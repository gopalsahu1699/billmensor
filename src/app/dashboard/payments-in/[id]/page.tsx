'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Trash2, Edit, Wallet, Calendar, Hash, Banknote, CreditCard, Send, Share2, Mail, FileText, ChevronDown, Download } from 'lucide-react'
import { downloadPDF, getPDFBlob } from '@/lib/pdf-utils'

export default function PaymentInDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [payment, setPayment] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sharing, setSharing] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)

    useEffect(() => {
        fetchPayment()
        fetchProfile()
    }, [resolvedParams.id])

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    async function fetchPayment() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('payments')
                .select('*, customers(*)')
                .eq('id', resolvedParams.id)
                .single()

            if (error) throw error
            setPayment(data)
        } catch (error: any) {
            toast.error('Failed to load payment details')
            router.push('/dashboard/payments-in')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this payment record?')) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('payments')
                .delete()
                .eq('id', resolvedParams.id)

            if (error) throw error

            toast.success('Payment deleted successfully')
            router.push('/dashboard/payments-in')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleEmail = () => {
        const subject = encodeURIComponent(`Receipt ${payment.payment_number} from ${profile?.company_name || 'Billmensor'}`)
        const body = encodeURIComponent(`Hello,\n\nPlease find the payment receipt ${payment.payment_number} details below:\n\nAmount Received: ₹${payment.amount.toLocaleString('en-IN')}\nDate: ${new Date(payment.payment_date).toLocaleDateString()}\nMode: ${payment.payment_mode}\n\nView details: ${window.location.href}\n\nThank you,\n${profile?.company_name || 'Billmensor'}`)
        window.location.href = `mailto:${payment.customers?.email || ''}?subject=${subject}&body=${body}`
        setIsShareOpen(false)
    }

    const handleShare = async () => {
        try {
            setSharing(true)
            const blob = await getPDFBlob('receipt-content')
            if (!blob) throw new Error('Failed to generate PDF')

            const file = new File([blob], `Receipt_${payment.payment_number}.pdf`, { type: 'application/pdf' })

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Receipt ${payment.payment_number}`,
                    text: `Payment Receipt from ${profile?.company_name || 'Billmensor'}`,
                })
            } else {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Receipt_${payment.payment_number}.pdf`
                a.click()
                toast.info('Sharing not supported, downloaded PDF instead')
            }
        } finally {
            setSharing(false)
            setIsShareOpen(false)
        }
    }

    const handleDownload = async () => {
        try {
            setSharing(true)
            await downloadPDF('receipt-content', `Receipt_${payment.payment_number}`)
            toast.success('Downloaded successfully')
        } catch (error: any) {
            toast.error('Download failed: ' + error.message)
        } finally {
            setSharing(false)
            setIsShareOpen(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-green-600 w-10 h-10" />
            <p className="text-slate-500 font-medium">Retrieving transaction details...</p>
        </div>
    )

    if (!payment) return null

    const getModeIcon = (mode: string) => {
        switch (mode?.toLowerCase()) {
            case 'bank': return <Banknote className="text-blue-500" />
            case 'upi': return <Send className="text-purple-500" />
            case 'cheque': return <CreditCard className="text-amber-500" />
            default: return <Wallet className="text-green-500" />
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 transition-all">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Payment In</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{payment.payment_number}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Receipt Details</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setIsShareOpen(!isShareOpen)}
                            className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        >
                            {sharing ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                            Share
                            <ChevronDown size={14} className={`ml-1 transition-transform ${isShareOpen ? 'rotate-180' : ''}`} />
                        </Button>

                        {isShareOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsShareOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={handleEmail}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest">Email Link</p>
                                            <p className="text-[10px] text-slate-400">Send via mail client</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        disabled={sharing}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <FileText size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest">Share PDF</p>
                                            <p className="text-[10px] text-slate-400">PDF via WhatsApp/Mail</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={sharing}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Download size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest">Download PDF</p>
                                            <p className="text-[10px] text-slate-400">Save to your device</p>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/payments-in/create?edit=${resolvedParams.id}`)}
                        className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-sm"
                    >
                        <Edit size={18} /> Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-red-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Trash2 size={18} /> Delete
                    </Button>
                </div>
            </div>

            <div id="receipt-content" className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-inherit">
                <div className="md:col-span-2 space-y-8">
                    {/* Amount Card */}
                    <Card className="bg-slate-900 text-white p-10 lg:p-12 rounded-[40px] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <Wallet size={120} />
                        </div>
                        <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-4">Total Amount Received</p>
                        <h2 className="text-6xl font-black tracking-tighter italic">₹ {payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                        <div className="mt-10 flex flex-wrap gap-6 pt-10 border-t border-white/10 uppercase font-black text-[10px] tracking-widest">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="text-slate-400">Date:</span>
                                <span>{new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Hash size={14} className="text-slate-400" />
                                <span className="text-slate-400">Mode:</span>
                                <span className="text-green-400">{payment.payment_mode}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Meta Section */}
                    <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Customer Info</h3>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-black text-slate-400">
                                        {payment.customers?.name?.charAt(0)}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <p className="font-black text-slate-900 text-2xl tracking-tight leading-tight">{payment.customers?.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">{payment.customers?.phone} • {payment.customers?.email || 'No email'}</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {(payment.billing_address || payment.customers?.billing_address) && (
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Billing Address</p>
                                                    <p className="text-xs text-slate-600 leading-relaxed italic">{payment.billing_address || payment.customers?.billing_address}</p>
                                                </div>
                                            )}
                                            {(payment.shipping_address || payment.customers?.shipping_address) && (
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Shipping Address</p>
                                                    <p className="text-xs text-slate-600 leading-relaxed italic">{payment.shipping_address || payment.customers?.shipping_address}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                GSTIN: <span className="text-slate-900">{payment.customers?.gstin || 'N/A'}</span>
                                            </p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Place of Supply: <span className="text-slate-900 uppercase">{payment.supply_place || payment.customers?.supply_place || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {payment.notes && (
                                <div className="pt-8 border-t border-slate-50">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remarks / Notes</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed italic">{payment.notes}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-100 rounded-[32px] p-8">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Transaction Tracking</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <Hash size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Receipt No</p>
                                        <p className="text-sm font-black text-slate-900">{payment.payment_number}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        {getModeIcon(payment.payment_mode)}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Payment Mode</p>
                                        <p className="text-sm font-black text-slate-900 uppercase italic">{payment.payment_mode}</p>
                                    </div>
                                </div>
                            </div>

                            {payment.reference_number && (
                                <div className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <Send size={18} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Ref / Txn ID</p>
                                            <p className="text-sm font-black text-slate-900">{payment.reference_number}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
