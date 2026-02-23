'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, RotateCcw, Loader2, Layout, Mail, Share2, Trash2, Edit } from 'lucide-react'
import { ProfessionalTemplate } from '@/components/print/ProfessionalTemplate'
import { CompactTemplate } from '@/components/print/CompactTemplate'
import { ModernTemplate } from '@/components/print/ModernTemplate'
import { InvoiceData, Profile, BankDetails, Item, Settings } from '@/types/print'

// Redundant interfaces removed, using shared types from @/types/print

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [quotation, setQuotation] = useState<InvoiceData | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState(false)
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [printSettings, setPrintSettings] = useState<Settings & { print_template: string }>({
        print_template: 'modern',
        show_bank_details: true,
        show_upi_qr: true,
        show_terms: true,
        show_signature: true,
        show_custom_fields: true,
        show_transport: true,
        show_installation: true,
    })

    const fetchQuotation = React.useCallback(async () => {
        try {
            setLoading(true)
            const [quoteRes, itemsRes] = await Promise.all([
                supabase.from('quotations').select('*, customers(*)').eq('id', resolvedParams.id).single(),
                supabase.from('quotation_items').select('*').eq('quotation_id', resolvedParams.id)
            ])

            if (quoteRes.error) throw quoteRes.error
            setQuotation(quoteRes.data as InvoiceData)
            setItems((itemsRes.data as Item[]) || [])

            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', quoteRes.data.user_id)
                .single()

            if (profData) {
                setProfile(profData as Profile)
                setPrintSettings({
                    print_template: profData.print_template || 'modern',
                    show_bank_details: profData.show_bank_details ?? true,
                    show_terms: profData.show_terms ?? true,
                    show_signature: profData.show_signature ?? true,
                    show_custom_fields: profData.show_custom_fields ?? true,
                    show_upi_qr: profData.show_upi_qr ?? true,
                    show_transport: profData.show_transport ?? true,
                    show_installation: profData.show_installation ?? true,
                })

                const { data: bankData } = await supabase
                    .from('company_bank_details')
                    .select('*')
                    .eq('user_id', quoteRes.data.user_id)
                    .maybeSingle()

                if (bankData) setBankDetails(bankData)
            }
        } catch (err: unknown) {
            console.error('Fetch quotation error:', err)
            toast.error('Failed to load quotation details')
            router.push('/dashboard/quotations')
        } finally {
            setLoading(false)
        }
    }, [resolvedParams.id, router])

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
    }, [fetchQuotation])



    const handleConvertToInvoice = async () => {
        if (!quotation) return
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
                    subtotal: quotation?.subtotal || 0,
                    discount: quotation?.discount || 0,
                    round_off: quotation?.round_off || 0,
                    tax_total: quotation?.tax_total || 0,
                    transport_charges: quotation?.transport_charges || 0,
                    installation_charges: quotation?.installation_charges || 0,
                    custom_charges: quotation?.custom_charges || [],
                    shipping_address: quotation?.shipping_address || null,
                    total_amount: quotation?.total_amount || 0,
                    notes: quotation?.notes || '',
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
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setConverting(false)
        }
    }

    async function handleDownload() {
        if (!quotation) return
        window.open(`/print/quotations/${quotation.id}`, '_blank')
    }

    async function handleShare() {
        if (!quotation || sharing) return
        setSharing(true)

        const shareData = {
            title: `Quotation ${quotation.quotation_number || ''}`,
            text: `View estimate ${quotation?.quotation_number || ''} from ${profile?.company_name || 'Billmensor'}`,
            url: window.location.href,
        }

        try {
            const printUrl = `${window.location.origin}/print/quotations/${quotation.id}`
            const updatedShareData = { ...shareData, url: printUrl }

            // Fallback to basic sharing
            if (navigator.share) {
                await navigator.share(updatedShareData)
                toast.success('Shared successfully')
            } else {
                await navigator.clipboard.writeText(printUrl)
                toast.success('Link copied to clipboard')
            }
        } catch (err: unknown) {
            console.error('Error sharing:', err)
            // Only show error if it's not the user cancelling
            if (err instanceof Error && err.name !== 'AbortError') {
                toast.error('Sharing failed')
            }
        } finally {
            setSharing(false)
        }
    }

    const handleEmail = () => {
        if (!quotation) return
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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            toast.error(msg)
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
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Quotations</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{quotation.quotation_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Estimate Details</h1>
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
                <div id="quotation-render-area" className="w-198.5 shrink-0 space-y-8 print:w-full">
                    {/* Template Rendering */}
                    {printSettings.print_template === 'professional' ? (
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
                            <ProfessionalTemplate
                                data={quotation}
                                profile={profile}
                                items={items}
                                bankDetails={bankDetails || undefined}
                                settings={printSettings}
                                type="quotation"
                            />
                        </div>
                    ) : printSettings.print_template === 'compact' ? (
                        <div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
                            <CompactTemplate
                                data={quotation}
                                profile={profile}
                                items={items}
                                bankDetails={bankDetails || undefined}
                                settings={printSettings}
                                type="quotation"
                            />
                        </div>
                    ) : (
                        <ModernTemplate
                            data={quotation}
                            profile={profile}
                            items={items}
                            bankDetails={bankDetails || undefined}
                            settings={printSettings}
                            type="quotation"
                        />
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print, .action-sidebar { display: none !important; }
                    body { background: white !important; padding: 0 !important; overflow: visible !important; }
                    .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    main { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
                    .shadow-xl, .shadow-2xl { box-shadow: none !important; border: none !important; }
                    .rounded-[48px], .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                    *::-webkit-scrollbar { display: none !important; }
                }
            `}</style>
        </div>
    )
}
