'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, RotateCcw, Loader2, Layout, Mail, FileText, Share2, Trash2, Edit } from 'lucide-react'
import { ProfessionalTemplate } from '@/components/print/ProfessionalTemplate'
import { CompactTemplate } from '@/components/print/CompactTemplate'
import { downloadPDF, getPDFBlob } from '@/lib/pdf-utils'

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [quotation, setQuotation] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState(false)
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [printSettings, setPrintSettings] = useState({
        print_template: 'modern',
        show_transport: true,
        show_installation: true,
        show_bank_details: true,
        show_upi_qr: true,
        show_terms: true,
        show_signature: true,
        show_custom_fields: true,
    })

    useEffect(() => {
        // Add print-specific styles
        const style = document.createElement('style')
        style.innerHTML = `
            @media print {
                nav, aside, button, .no-print, .action-sidebar { display: none !important; }
                body { background: white !important; padding: 0 !important; }
                .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                main { padding: 0 !important; margin: 0 !important; }
                .shadow-xl, .shadow-2xl, .shadow-md { box-shadow: none !important; border: none !important; }
                .rounded-[48px], .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
            }
        `
        document.head.appendChild(style)
        return () => { document.head.removeChild(style) }
    }, [])

    useEffect(() => {
        fetchQuotation()
    }, [resolvedParams.id])

    async function fetchQuotation() {
        try {
            setLoading(true)
            // Updated to use parties and party_id
            const [quoteRes, itemsRes] = await Promise.all([
                supabase.from('quotations').select('*, customers(*)').eq('id', resolvedParams.id).single(),
                supabase.from('quotation_items').select('*').eq('quotation_id', resolvedParams.id)
            ])

            if (quoteRes.error) throw quoteRes.error
            setQuotation(quoteRes.data)
            setItems(itemsRes.data || [])

            // Fetch business profile and print settings
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', quoteRes.data.user_id)
                .single()

            if (profData) {
                setProfile(profData)
                setPrintSettings({
                    print_template: profData.print_template || 'modern',
                    show_transport: profData.show_transport ?? true,
                    show_installation: profData.show_installation ?? true,
                    show_bank_details: profData.show_bank_details ?? true,
                    show_upi_qr: profData.show_upi_qr ?? true,
                    show_terms: profData.show_terms ?? true,
                    show_signature: profData.show_signature ?? true,
                    show_custom_fields: profData.show_custom_fields ?? true,
                })
            }
        } catch (error: any) {
            toast.error('Failed to load quotation details')
            router.push('/dashboard/quotations')
        } finally {
            setLoading(false)
        }
    }

    const handleConvertToInvoice = async () => {
        setConverting(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Generate Next Invoice Number
            const now = new Date()
            const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
            const prefix = `INV-${yearMonth}-`

            const { data: lastInvoice } = await supabase
                .from('invoices')
                .select('invoice_number')
                .like('invoice_number', `${prefix}%`)
                .order('invoice_number', { ascending: false })
                .limit(1)

            let nextInvoiceNumber = `${prefix}001`
            if (lastInvoice && lastInvoice.length > 0) {
                const parts = lastInvoice[0].invoice_number.split('-')
                const lastCounter = parseInt(parts[2]) || 0
                nextInvoiceNumber = `${prefix}${(lastCounter + 1).toString().padStart(3, '0')}`
            }

            // 2. Create Invoice
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert([{
                    user_id: userData.user.id,
                    customer_id: quotation.customer_id,
                    invoice_number: nextInvoiceNumber,
                    invoice_date: new Date().toISOString().split('T')[0],
                    subtotal: quotation.subtotal,
                    discount: quotation.discount || 0,
                    round_off: quotation.round_off || 0,
                    tax_total: quotation.tax_total || 0,
                    transport_charges: quotation.transport_charges || 0,
                    installation_charges: quotation.installation_charges || 0,
                    custom_charges: quotation.custom_charges || [],
                    shipping_address: quotation.shipping_address || null,
                    total_amount: quotation.total_amount,
                    notes: quotation.notes || '',
                    payment_status: 'unpaid'
                }])
                .select()
                .single()

            if (invError) throw invError

            // 2. Create Invoice Items
            const invoiceItems = items.map(item => ({
                user_id: userData.user.id,
                invoice_id: invoice.id,
                product_id: item.product_id || null,
                name: item.name,
                hsn_code: item.hsn_code || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate || 0,
                tax_amount: item.tax_amount || 0,
                discount: item.discount || 0,
                total: item.total
            }))

            const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
            if (itemsError) throw itemsError

            // 3. Update Quotation Status
            await supabase.from('quotations').update({ status: 'invoiced' }).eq('id', resolvedParams.id)

            toast.success('Successfully converted Quotation to Invoice!')
            router.push(`/dashboard/invoices/${invoice.id}`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setConverting(false)
        }
    }

    async function handleDownload() {
        try {
            const fileName = `Quotation-${quotation.quotation_number}`
            await downloadPDF('quotation-render-area', fileName)
            toast.success('Quotation downloaded successfully')
        } catch (error) {
            toast.error('Failed to generate PDF')
        }
    }

    async function handleShare() {
        if (sharing) return
        setSharing(true)

        const shareData: any = {
            title: `Quotation ${quotation.quotation_number}`,
            text: `View estimate ${quotation.quotation_number} from ${profile?.company_name || 'Billmensor'}`,
            url: window.location.href,
        }

        try {
            // Try to share as a file first if supported
            const blob = await getPDFBlob('quotation-render-area')
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], `Quotation-${quotation.quotation_number}.pdf`, { type: 'application/pdf' })] })) {
                const file = new File([blob], `Quotation-${quotation.quotation_number}.pdf`, { type: 'application/pdf' })
                await navigator.share({
                    ...shareData,
                    files: [file]
                })
                toast.success('Estimate PDF shared successfully')
                return
            }

            // Fallback to basic sharing
            if (navigator.share) {
                await navigator.share(shareData)
                toast.success('Shared successfully')
            } else {
                await navigator.clipboard.writeText(window.location.href)
                toast.success('Link copied to clipboard')
            }
        } catch (error) {
            console.error('Error sharing:', error)
            // Only show error if it's not the user cancelling
            if ((error as any).name !== 'AbortError') {
                toast.error('Sharing failed')
            }
        } finally {
            setSharing(false)
        }
    }

    const handleEmail = () => {
        const subject = encodeURIComponent(`Quotation ${quotation.quotation_number} from ${profile?.company_name || 'Billmensor'}`)
        const body = encodeURIComponent(`Hello,\n\nPlease find the quotation details for ${quotation.quotation_number} at the following link:\n\n${window.location.href}\n\nTotal Amount: ₹${quotation.total_amount.toLocaleString('en-IN')}\n\nThank you,\n${profile?.company_name || 'Billmensor'}`)
        window.location.href = `mailto:${quotation.customers?.email || ''}?subject=${subject}&body=${body}`
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return

        try {
            setLoading(true)
            // Delete quotation items first
            const { error: itemsError } = await supabase
                .from('quotation_items')
                .delete()
                .eq('quotation_id', resolvedParams.id)

            if (itemsError) throw itemsError

            // Delete the quotation
            const { error: quotationError } = await supabase
                .from('quotations')
                .delete()
                .eq('id', resolvedParams.id)

            if (quotationError) throw quotationError

            toast.success('Estimate deleted successfully')
            router.push('/dashboard/quotations')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <p className="text-slate-500 font-medium">Loading professional estimate...</p>
        </div>
    )

    if (!quotation) return null

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Quotations</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{quotation.quotation_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Estimate Details</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${quotation.status === 'invoiced' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                {quotation.status}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                            className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Layout size={18} /> {printSettings.print_template} Template
                        </Button>

                        {isTemplateMenuOpen && (
                            <div className="absolute top-14 left-0 w-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    {['modern', 'professional', 'compact'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => {
                                                setPrintSettings(prev => ({ ...prev, print_template: t }))
                                                setIsTemplateMenuOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${printSettings.print_template === t
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            {t} Template
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 mx-2">
                                    <Link href="/dashboard/settings/print" className="text-[9px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-widest text-center block" onClick={() => setIsTemplateMenuOpen(false)}>
                                        Configure Defaults →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {isTemplateMenuOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsTemplateMenuOpen(false)}
                            />
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        {sharing ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                        {sharing ? 'Sharing...' : 'Share'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleEmail}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Mail size={18} /> Email
                    </Button>
                    {quotation.status !== 'invoiced' && (
                        <Button
                            onClick={handleConvertToInvoice}
                            disabled={converting}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 h-12 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                        >
                            {converting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                            {converting ? 'CONVERTING...' : 'TO INVOICE'}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/quotations/create?edit=${resolvedParams.id}`)}
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
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Download
                    </Button>
                </div>
            </div>

            <div className="flex justify-center w-full overflow-x-auto pb-8 custom-scrollbar">
                {/* Main Content Area */}
                <div id="quotation-render-area" className="w-[794px] shrink-0 space-y-8 print:w-full">
                    {/* Template Rendering */}
                    {printSettings.print_template === 'professional' ? (
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
                            <ProfessionalTemplate
                                data={quotation}
                                profile={profile}
                                items={items}
                                settings={printSettings}
                                type="quotation"
                            />
                        </div>
                    ) : printSettings.print_template === 'compact' ? (
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
                            <CompactTemplate
                                data={quotation}
                                profile={profile}
                                items={items}
                                settings={printSettings}
                                type="quotation"
                            />
                        </div>
                    ) : (
                        /* Default / Modern Template */
                        <Card className="rounded-[40px] border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:p-0">
                            <div className="p-10 lg:p-16 space-y-12">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-6">
                                        {profile?.logo_url ? (
                                            <img src={profile.logo_url} alt="Logo" className="w-[140px] h-10 object-contain" />
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-900/30">
                                                <span className="material-symbols-outlined text-[32px]">payments</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Estimate / Proforma</p>
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">{quotation.quotation_number}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            {quotation.status}
                                        </div>
                                        <div className="mt-8 text-sm text-slate-500 font-bold uppercase tracking-widest">
                                            <p className="text-[10px] text-slate-400 mb-1">Issue Date</p>
                                            <p className="text-slate-900">{new Date(quotation.quotation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            {quotation.expiry_date && (
                                                <div className="mt-4">
                                                    <p className="text-[10px] text-slate-400 mb-1">Valid Until</p>
                                                    <p className="text-red-600">{new Date(quotation.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Vendor Info</p>
                                        <p className="font-black text-slate-900 text-xl">{profile?.company_name || 'Billmensor'}</p>
                                        <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">{profile?.address}</p>
                                        <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">GSTIN: <span className="text-slate-900">{profile?.gstin}</span></span>
                                            <span className="text-slate-400">Phone: <span className="text-slate-900">{profile?.phone}</span></span>
                                            <span className="text-slate-400">Email: <span className="text-slate-900">{profile?.email}</span></span>
                                        </div>
                                        {printSettings.show_custom_fields && (
                                            <div className="mt-4 space-y-1 text-[10px] font-bold uppercase tracking-wider">
                                                {profile?.custom_field_1_label && (
                                                    <p className="text-slate-400">{profile.custom_field_1_label}: <span className="text-slate-900">{profile.custom_field_1_value}</span></p>
                                                )}
                                                {profile?.custom_field_2_label && (
                                                    <p className="text-slate-400">{profile.custom_field_2_label}: <span className="text-slate-900">{profile.custom_field_2_value}</span></p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right border-l border-slate-200 pl-12 flex flex-col justify-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Estimate For</p>
                                        <p className="font-black text-slate-900 text-xl">{quotation.customers?.name}</p>
                                        <p className="text-sm text-slate-500 mt-2 italic leading-relaxed">{quotation.billing_address || quotation.customers?.billing_address}</p>
                                        <p className="text-sm font-black text-blue-600 mt-2 uppercase tracking-widest">
                                            GST: {quotation.customers?.gstin || 'NOT REGISTERED'} | POS: {quotation.supply_place || quotation.customers?.supply_place || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <th className="px-4 pb-2 w-12">#</th>
                                                <th className="px-4 pb-2">Item Description</th>
                                                <th className="px-4 pb-2 text-center">Qty</th>
                                                <th className="px-4 pb-2 text-center">Rate</th>
                                                <th className="px-4 pb-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="bg-white border-y border-slate-50 group hover:shadow-lg transition-all duration-300">
                                                    <td className="px-4 py-8 rounded-l-3xl border-l border-y border-slate-100 font-black text-slate-300">{index + 1}</td>
                                                    <td className="px-4 py-8 border-y border-slate-100">
                                                        <p className="font-black text-slate-900">{item.item_name || item.name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">HSN Code: {item.hsn_code || '-'}</p>
                                                    </td>
                                                    <td className="px-4 py-8 border-y border-slate-100 text-center font-black">{item.quantity}</td>
                                                    <td className="px-4 py-8 border-y border-slate-100 text-center font-bold text-slate-500">₹{(item.rate || item.unit_price || 0).toLocaleString('en-IN')}</td>
                                                    <td className="px-4 py-8 rounded-r-3xl border-r border-y border-slate-100 text-right font-black italic text-slate-900">₹{(item.total || 0).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-between items-start pt-12 border-t-2 border-slate-100">
                                    <div className="max-w-xs space-y-6">
                                        {printSettings.show_terms && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Terms & Notes</p>
                                                <p className="text-xs text-slate-500 leading-relaxed italic opacity-80">{quotation.notes || 'This estimate is valid for 15 days.'}</p>
                                            </div>
                                        )}

                                    </div>
                                    <div className="w-80 space-y-4 text-right ml-auto">
                                        <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Subtotal</span>
                                            <span className="text-slate-900 font-black">₹{(quotation.subtotal || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Tax Amount</span>
                                            <span className="text-slate-900 font-black">₹{(quotation.tax_total || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        {quotation.transport_charges > 0 && (
                                            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest italic">
                                                <span>Transport</span>
                                                <span className="text-slate-900 font-black">₹{(quotation.transport_charges).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {quotation.installation_charges > 0 && (
                                            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest italic">
                                                <span>Installation</span>
                                                <span className="text-slate-900 font-black">₹{(quotation.installation_charges).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {quotation.custom_charges && Array.isArray(quotation.custom_charges) && quotation.custom_charges.map((charge: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest italic">
                                                <span>{charge.name || 'Custom Charge'}</span>
                                                <span className="text-slate-900 font-black">₹{(charge.amount || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-end pt-8 mt-4 border-t-4 border-slate-900">
                                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Estimated Total</span>
                                            <span className="text-5xl font-black tracking-tighter italic text-slate-900">₹{(quotation.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {printSettings.show_signature && (
                                            <div className="pt-8 border-t border-dashed border-slate-200 mt-6 flex flex-col items-end text-right">
                                                <div className="mb-2">
                                                    {profile?.signature_url ? (
                                                        <img src={profile.signature_url} alt="Signature" className="h-12 w-auto grayscale opacity-80" />
                                                    ) : (
                                                        <div className="h-12 w-24 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                                            <span className="text-[10px] uppercase font-bold tracking-widest">Sign Here</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Signature</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">For {profile?.company_name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print, .action-sidebar { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .shadow-xl, .shadow-2xl { box-shadow: none !important; border: none !important; }
                    .rounded-[48px], .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    )
}
