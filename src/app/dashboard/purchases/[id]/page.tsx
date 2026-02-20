'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, Trash2, Edit, ShoppingCart, Calendar, Hash, Truck, CheckCircle2 } from 'lucide-react'
import { downloadPDF } from '@/lib/pdf-utils'

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [purchase, setPurchase] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPurchase()
    }, [resolvedParams.id])

    async function fetchPurchase() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('purchases')
                .select('*, suppliers:supplier_id(*)')
                .eq('id', resolvedParams.id)
                .single()

            if (error) throw error
            setPurchase(data)

            const { data: itemsData, error: itemsError } = await supabase
                .from('purchase_items')
                .select('*')
                .eq('purchase_id', resolvedParams.id)

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
            toast.error('Failed to load purchase details')
            router.push('/dashboard/purchases')
        } finally {
            setLoading(false)
        }
    }

    async function handleMarkAsPaid() {
        try {
            const { error } = await supabase
                .from('purchases')
                .update({ payment_status: 'paid' })
                .eq('id', resolvedParams.id)

            if (error) throw error
            toast.success('Purchase bill marked as paid')
            fetchPurchase()
        } catch (error: any) {
            toast.error('Failed to update status: ' + error.message)
        }
    }

    async function handleDownload() {
        try {
            const fileName = `Purchase-${purchase.purchase_number}`
            await downloadPDF('purchase-render-area', fileName)
            toast.success('Purchase bill downloaded')
        } catch (error) {
            toast.error('Failed to generate PDF')
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this purchase? This will NOT automatically reverse stock adjustments.')) return

        try {
            setLoading(true)
            // 1. Delete purchase items
            const { error: itemsError } = await supabase.from('purchase_items').delete().eq('purchase_id', resolvedParams.id)
            if (itemsError) throw itemsError

            // 2. Delete purchase
            const { error: purError } = await supabase.from('purchases').delete().eq('id', resolvedParams.id)
            if (purError) throw purError

            toast.success('Purchase deleted successfully')
            router.push('/dashboard/purchases')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <p className="text-slate-500 font-medium">Loading purchase details...</p>
        </div>
    )

    if (!purchase) return null

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
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Inventory Acquisition</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{purchase.purchase_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Purchase Bill</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                {purchase.payment_status || 'unpaid'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {purchase.payment_status !== 'paid' && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAsPaid}
                            className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-green-200 text-green-600 hover:bg-green-50 transition-all shadow-sm"
                        >
                            <CheckCircle2 size={18} /> Mark as Paid
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/purchases/create?edit=${resolvedParams.id}`)}
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
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Download Bill
                    </Button>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
                <div id="purchase-render-area" className="w-[794px] shrink-0 bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:w-full print:shadow-none print:border-none">
                    <div className="p-10 lg:p-16 space-y-12">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-6">
                                {profile?.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="w-[140px] h-10 object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                                        <ShoppingCart size={32} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Purchase Invoice</p>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{purchase.purchase_number}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="mt-8">
                                    <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest">Bill Date</p>
                                    <p className="text-lg font-black text-slate-900">{new Date(purchase.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Supplier / Vendor</p>
                                <p className="font-black text-slate-900 text-2xl tracking-tight">{purchase.suppliers?.name}</p>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">{purchase.billing_address || purchase.suppliers?.billing_address}</p>
                                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">GSTIN: <span className="text-slate-900">{purchase.suppliers?.gstin || 'N/A'}</span></span>
                                    <span className="text-slate-400">POS: <span className="text-slate-900">{purchase.supply_place || purchase.suppliers?.supply_place || 'N/A'}</span></span>
                                    <span className="text-slate-400">Phone: <span className="text-slate-900">{purchase.suppliers?.phone}</span></span>
                                </div>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-12 flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Billed To</p>
                                <p className="font-black text-slate-900 text-xl">{profile?.company_name || 'Your Business'}</p>
                                <p className="text-sm text-slate-500 mt-1 italic">{profile?.address}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-4 pb-4 w-12">#</th>
                                        <th className="px-4 pb-4">Product / Service</th>
                                        <th className="px-4 pb-4 text-center">Qty</th>
                                        <th className="px-4 pb-4 text-center">Unit Price</th>
                                        <th className="px-4 pb-4 text-center">Tax %</th>
                                        <th className="px-4 pb-4 text-right">Total</th>
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal Notes</p>
                                <p className="text-sm text-slate-500 italic leading-relaxed">{purchase.notes || 'No adjustment notes recorded.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Total Investment</p>
                                <p className="text-5xl font-black italic tracking-tighter text-slate-900">₹{purchase.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
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
