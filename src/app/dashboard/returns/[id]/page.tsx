'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, Trash2, Edit, RotateCcw, Calendar, Hash, User } from 'lucide-react'
import { downloadPDF } from '@/lib/pdf-utils'

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [returnDoc, setReturnDoc] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReturn()
    }, [resolvedParams.id])

    async function fetchReturn() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('returns')
                .select('*, customers!customer_id(*)')
                .eq('id', resolvedParams.id)
                .single()

            if (error) throw error
            setReturnDoc(data)

            const { data: itemsData, error: itemsError } = await supabase
                .from('return_items')
                .select('*')
                .eq('return_id', resolvedParams.id)

            if (itemsError) throw itemsError
            setItems(itemsData || [])

            // Fetch business profile
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user_id)
                .single()

            if (profData) setProfile(profData)
        } catch (error: any) {
            toast.error('Failed to load return details')
            router.push('/dashboard/returns')
        } finally {
            setLoading(false)
        }
    }

    async function handleDownload() {
        try {
            const fileName = `Return-${returnDoc.return_number}`
            await downloadPDF('return-render-area', fileName)
            toast.success('Return note downloaded')
        } catch (error) {
            toast.error('Failed to generate PDF')
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this return? Stock levels will NOT be automatically reverted.')) return

        try {
            setLoading(true)
            await supabase.from('return_items').delete().eq('return_id', resolvedParams.id)
            const { error } = await supabase.from('returns').delete().eq('id', resolvedParams.id)

            if (error) throw error

            toast.success('Return deleted successfully')
            router.push('/dashboard/returns')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <p className="text-slate-500 font-medium">Loading adjustment details...</p>
        </div>
    )

    if (!returnDoc) return null

    const isSalesReturn = returnDoc.type === 'sales_return'

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSalesReturn ? 'text-orange-500' : 'text-blue-500'}`}>
                                {isSalesReturn ? 'Sales Return' : 'Purchase Return'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{returnDoc.return_number}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
                            {isSalesReturn ? 'Credit Note' : 'Debit Note'}
                        </h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/returns/create?type=${returnDoc.type}&edit=${resolvedParams.id}`)}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit size={18} /> Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-red-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Trash2 size={18} /> Delete
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className={`flex items-center gap-2 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all ${isSalesReturn ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}
                    >
                        <Download size={18} /> Download Note
                    </Button>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
                <div id="return-render-area" className="w-[794px] shrink-0 bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:w-full print:shadow-none print:border-none">
                    <div className="p-10 lg:p-16 space-y-12">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-6">
                                {profile?.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="w-[140px] h-10 object-contain" />
                                ) : (
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl ${isSalesReturn ? 'bg-orange-600 shadow-orange-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
                                        <RotateCcw size={32} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Stock Adjustment Note</p>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{returnDoc.return_number}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600`}>
                                    Official Adjustment
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest">Adjustment Date</p>
                                    <p className="text-lg font-black text-slate-900">{new Date(returnDoc.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{isSalesReturn ? 'Customer' : 'Supplier'}</p>
                                <p className="font-black text-slate-900 text-2xl tracking-tight">{returnDoc.customers?.name}</p>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">{returnDoc.billing_address || returnDoc.customers?.billing_address}</p>
                                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">GSTIN: <span className="text-slate-900">{returnDoc.customers?.gstin || 'N/A'}</span></span>
                                    <span className="text-slate-400">POS: <span className="text-slate-900">{returnDoc.supply_place || returnDoc.customers?.supply_place || 'N/A'}</span></span>
                                    <span className="text-slate-400">Phone: <span className="text-slate-900">{returnDoc.customers?.phone}</span></span>
                                </div>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-12 flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Issued By</p>
                                <p className="font-black text-slate-900 text-xl">{profile?.company_name || 'Your Business'}</p>
                                <p className="text-sm text-slate-500 mt-1 italic">{profile?.address}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-4 pb-4 w-12">#</th>
                                        <th className="px-4 pb-4">Product Adjustment</th>
                                        <th className="px-4 pb-4 text-center">Qty</th>
                                        <th className="px-4 pb-4 text-center">Base Rate</th>
                                        <th className="px-4 pb-4 text-center">Tax %</th>
                                        <th className="px-4 pb-4 text-right">Adjustment Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item, index) => (
                                        <tr key={index} className="group transition-all">
                                            <td className="px-4 py-8 font-black text-slate-300">{index + 1}</td>
                                            <td className="px-4 py-8">
                                                <p className="font-black text-slate-900 uppercase italic tracking-tight">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-8 text-center font-black">{item.quantity}</td>
                                            <td className="px-4 py-8 text-center font-bold text-slate-500">₹{item.unit_price?.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-8 text-center font-bold text-slate-500">{item.tax_rate}%</td>
                                            <td className="px-4 py-8 text-right font-black italic text-slate-900">₹{item.total?.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-start pt-12 border-t-2 border-slate-900">
                            <div className="max-w-xs">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reason for Adjustment</p>
                                <p className="text-sm text-slate-500 italic leading-relaxed">{returnDoc.notes || 'Official stock reconciliation/return.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Total Refund / Adjustment</p>
                                <p className="text-5xl font-black italic tracking-tighter text-slate-900">₹{returnDoc.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .shadow-2xl { box-shadow: none !important; border: none !important; }
                    .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    )
}
