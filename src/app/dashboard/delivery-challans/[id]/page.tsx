'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, Share2, Trash2, Edit, Truck, Package } from 'lucide-react'
import { downloadPDF } from '@/lib/pdf-utils'

export default function DeliveryChallanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [challan, setChallan] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchChallan()
    }, [resolvedParams.id])

    async function fetchChallan() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('delivery_challans')
                .select('*, customers(*)')
                .eq('id', resolvedParams.id)
                .single()

            if (error) throw error
            setChallan(data)

            // Fetch business profile
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user_id)
                .single()

            if (profData) setProfile(profData)
        } catch (error: any) {
            toast.error('Failed to load challan details')
            router.push('/dashboard/delivery-challans')
        } finally {
            setLoading(false)
        }
    }

    async function handleDownload() {
        try {
            const fileName = `Challan-${challan.challan_number}`
            await downloadPDF('challan-render-area', fileName)
            toast.success('Challan downloaded successfully')
        } catch (error) {
            toast.error('Failed to generate PDF')
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this challan?')) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('delivery_challans')
                .delete()
                .eq('id', resolvedParams.id)

            if (error) throw error

            toast.success('Challan deleted successfully')
            router.push('/dashboard/delivery-challans')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <p className="text-slate-500 font-medium">Loading challan details...</p>
        </div>
    )

    if (!challan) return null

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-600'
            case 'invoiced': return 'bg-blue-100 text-blue-600'
            case 'cancelled': return 'bg-red-100 text-red-600'
            default: return 'bg-amber-100 text-amber-600'
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Challan</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{challan.challan_number}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Delivery Challan</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/delivery-challans/create?edit=${resolvedParams.id}`)}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest transition-all shadow-sm"
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
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Download
                    </Button>
                </div>
            </div>

            {/* Render Area */}
            <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
                <div id="challan-render-area" className="w-[794px] shrink-0 bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:w-full print:shadow-none print:border-none">
                    <div className="p-10 lg:p-16 space-y-12">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-6">
                                {profile?.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="w-[140px] h-10 object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white">
                                        <Truck size={32} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Delivery Document</p>
                                    <h2 className="text-4xl font-black text-slate-900 italic">{challan.challan_number}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(challan.status)}`}>
                                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                    {challan.status}
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-black">Challan Date</p>
                                    <p className="text-lg font-black text-slate-900">{new Date(challan.challan_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">From</p>
                                <p className="font-black text-slate-900 text-xl">{profile?.company_name || 'Your Business'}</p>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">{profile?.address}</p>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-12">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Deliver To</p>
                                <p className="font-black text-slate-900 text-xl">{challan.customers?.name}</p>
                                <p className="text-sm text-slate-500 mt-2 italic leading-relaxed">{challan.shipping_address || challan.billing_address || challan.customers?.shipping_address || challan.customers?.billing_address}</p>
                                <p className="text-sm font-black text-blue-600 mt-2">
                                    GST: {challan.customers?.gstin || 'N/A'} | POS: {challan.supply_place || challan.customers?.supply_place || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-4 pb-4 w-12">#</th>
                                        <th className="px-4 pb-4">Item Description</th>
                                        <th className="px-4 pb-4 text-center">Quantity</th>
                                        <th className="px-4 pb-4 text-center">Rate</th>
                                        <th className="px-4 pb-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {challan.items?.map((item: any, index: number) => (
                                        <tr key={index} className="group transition-all">
                                            <td className="px-4 py-8 font-black text-slate-300">{index + 1}</td>
                                            <td className="px-4 py-8">
                                                <p className="font-black text-slate-900 uppercase italic tracking-tight">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-8 text-center font-black">{item.quantity}</td>
                                            <td className="px-4 py-8 text-center font-bold text-slate-500">₹{item.unit_price?.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-8 text-right font-black italic text-slate-900">₹{item.total?.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-start pt-12 border-t border-slate-100">
                            <div className="max-w-xs">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                                <p className="text-sm text-slate-500 italic leading-relaxed">{challan.notes || 'No specific delivery instructions.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Total Indicative Value</p>
                                <p className="text-5xl font-black italic tracking-tighter text-slate-900">₹{challan.total_amount?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    )
}
