'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, RotateCcw, Layout, Mail, CheckCircle2, Share2, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ProfessionalTemplate } from '@/components/print/ProfessionalTemplate'
import { CompactTemplate } from '@/components/print/CompactTemplate'
import { downloadPDF, getPDFBlob } from '@/lib/pdf-utils'

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [invoice, setInvoice] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [bankDetails, setBankDetails] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
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
                body { background: white !important; padding: 0 !important; margin: 0 !important; }
                .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                main { padding: 0 !important; margin: 0 !important; }
                .shadow-xl, .shadow-2xl, .shadow-md { box-shadow: none !important; border: none !important; }
                .rounded-[48px], .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                .bg-slate-50\/50 { background-color: transparent !important; }
                #invoice-render-area * { color: #000 !important; }
                @page { margin: 1cm; }
            }
        `
        document.head.appendChild(style)
        return () => { document.head.removeChild(style) }
    }, [])

    useEffect(() => {
        fetchInvoiceDetails()
    }, [id])

    async function fetchInvoiceDetails() {
        try {
            setLoading(true)
            // Reverted to use invoices and customers
            const { data, error } = await supabase
                .from('invoices')
                .select('*, customers (*)')
                .eq('id', id)
                .single()

            if (error) throw error
            setInvoice(data)

            // Fetch business profile and print settings
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user_id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setPrintSettings({
                    print_template: profileData.print_template || 'modern',
                    show_transport: profileData.show_transport ?? true,
                    show_installation: profileData.show_installation ?? true,
                    show_bank_details: profileData.show_bank_details ?? true,
                    show_upi_qr: profileData.show_upi_qr ?? true,
                    show_terms: profileData.show_terms ?? true,
                    show_signature: profileData.show_signature ?? true,
                    show_custom_fields: profileData.show_custom_fields ?? true,
                })

                // Fetch bank details
                const { data: bankData } = await supabase
                    .from('company_bank_details')
                    .select('*')
                    .eq('user_id', data.user_id)
                    .maybeSingle()
                if (bankData) setBankDetails(bankData)
            }

            // Reverted to use invoice_items
            const { data: itemsData, error: itemsError } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', id)

            if (itemsError) throw itemsError
            setItems(itemsData || [])
        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/invoices')
        } finally {
            setLoading(false)
        }
    }

    async function handleMarkAsPaid() {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ payment_status: 'paid', amount_paid: invoice.total_amount, balance_amount: 0 })
                .eq('id', id)

            if (error) throw error
            toast.success('Invoice marked as paid')
            fetchInvoiceDetails()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function handleShare() {
        if (sharing) return
        setSharing(true)

        const shareData: any = {
            title: `Invoice ${invoice.invoice_number}`,
            text: `View invoice ${invoice.invoice_number} from ${profile?.company_name || 'Billmensor'}`,
            url: window.location.href,
        }

        try {
            // Try to share as a file first if supported
            const blob = await getPDFBlob('invoice-render-area')
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], `Invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' })] })) {
                const file = new File([blob], `Invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' })
                await navigator.share({
                    ...shareData,
                    files: [file]
                })
                toast.success('Invoice PDF shared successfully')
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
        const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} from ${profile?.company_name || 'Billmensor'}`)
        const body = encodeURIComponent(`Hello,\n\nPlease find the invoice details for ${invoice.invoice_number} at the following link:\n\n${window.location.href}\n\nTotal Amount: ₹${invoice.total_amount.toLocaleString('en-IN')}\n\nThank you,\n${profile?.company_name || 'Billmensor'}`)
        window.location.href = `mailto:${invoice.customers?.email || ''}?subject=${subject}&body=${body}`
    }

    async function handleDownload() {
        try {
            const fileName = `Invoice-${invoice.invoice_number}`
            await downloadPDF('invoice-render-area', fileName)
            toast.success('Invoice downloaded successfully')
        } catch (error) {
            toast.error('Failed to generate PDF')
        }
    }

    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

        try {
            setLoading(true)
            // Delete invoice items first
            const { error: itemsError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoice_id', id)

            if (itemsError) throw itemsError

            // Delete the invoice
            const { error: invoiceError } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id)

            if (invoiceError) throw invoiceError

            toast.success('Invoice deleted successfully')
            router.push('/dashboard/invoices')
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                <p className="text-slate-500 font-medium">Loading professional workspace...</p>
            </div>
        )
    }

    if (!invoice) return null

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Invoices</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Invoice Details</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                {invoice.payment_status}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {invoice.payment_status !== 'paid' && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAsPaid}
                            className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-green-200 text-green-600 hover:bg-green-50 transition-all shadow-sm"
                        >
                            <CheckCircle2 size={18} /> Mark as Paid
                        </Button>
                    )}
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
                                    <Link href="/dashboard/settings/print" className="text-[9px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-widest text-center block">
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
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/invoices/create?edit=${id}`)}
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
                <div id="invoice-render-area" className="w-[794px] shrink-0 space-y-8 print:w-full">
                    {/* Template Rendering */}
                    {printSettings.print_template === 'professional' ? (
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
                            <ProfessionalTemplate
                                data={invoice}
                                profile={profile}
                                bankDetails={bankDetails}
                                items={items}
                                settings={printSettings}
                                type="invoice"
                            />
                        </div>
                    ) : printSettings.print_template === 'compact' ? (
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
                            <CompactTemplate
                                data={invoice}
                                profile={profile}
                                bankDetails={bankDetails}
                                items={items}
                                settings={printSettings}
                                type="invoice"
                            />
                        </div>
                    ) : (
                        /* Default / Modern Template */
                        <Card className="rounded-[40px] border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:p-0">
                            <div className="p-8 lg:p-12 space-y-8 print:p-0 text-[10px] leading-tight text-slate-950">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-4">
                                        {profile?.logo_url ? (
                                            <img src={profile.logo_url} alt="Logo" className="w-[120px] h-8 object-contain" />
                                        ) : (
                                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                                                <span className="material-symbols-outlined text-[24px]">analytics</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-1">Tax Invoice</p>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">{invoice.invoice_number}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${invoice.payment_status === 'paid' ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></span>
                                            {invoice.payment_status}
                                        </div>
                                        <div className="mt-4 text-sm text-slate-700 font-bold uppercase tracking-widest">
                                            <p className="text-[9px] text-slate-700 mb-0.5">Issue Date</p>
                                            <p className="text-slate-900 text-xs">{new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 print:bg-transparent print:p-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-2">Vendor Info</p>
                                        <p className="font-black text-slate-900 text-lg leading-none">{profile?.company_name || 'Billmensor'}</p>
                                        <p className="text-xs text-slate-700 mt-1 leading-normal italic">{profile?.address}</p>
                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-black uppercase tracking-tight">
                                            <span className="text-slate-700">GST: <span className="text-slate-900">{profile?.gstin}</span></span>
                                            <span className="text-slate-700">Mob: <span className="text-slate-900">{profile?.phone}</span></span>
                                        </div>
                                        {printSettings.show_custom_fields && (profile?.custom_field_1_label || profile?.custom_field_2_label) && (
                                            <div className="mt-2 space-y-0.5 text-[8px] font-bold uppercase tracking-wider border-t border-slate-200/50 pt-2">
                                                {profile?.custom_field_1_label && (
                                                    <p className="text-slate-700">{profile.custom_field_1_label}: <span className="text-slate-900">{profile.custom_field_1_value}</span></p>
                                                )}
                                                {profile?.custom_field_2_label && (
                                                    <p className="text-slate-700">{profile.custom_field_2_label}: <span className="text-slate-900">{profile.custom_field_2_value}</span></p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right border-l border-slate-200 pl-8 flex flex-col justify-center space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-2">Bill To Client</p>
                                        <p className="font-black text-slate-900 text-lg leading-none">{invoice.customers?.name}</p>
                                        <p className="text-xs text-slate-700 mt-1 leading-normal italic">{invoice.billing_address || invoice.customers?.billing_address}</p>
                                        <p className="text-[9px] font-black text-blue-600 mt-1 uppercase tracking-tight">
                                            GST: {invoice.customers?.gstin || 'NOT REGISTERED'} <br /> POS: {invoice.supply_place || invoice.customers?.supply_place || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-700 border-b border-slate-100">
                                                <th className="px-2 pb-2 w-8">#</th>
                                                <th className="px-2 pb-2">Description</th>
                                                <th className="px-2 pb-2 text-center">Qty</th>
                                                <th className="px-2 pb-2 text-center">Rate</th>
                                                <th className="px-2 pb-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="bg-white border-b border-slate-50 group hover:shadow-lg transition-all duration-300">
                                                    <td className="px-2 py-2.5 font-black text-slate-300 text-xs">{index + 1}</td>
                                                    <td className="px-2 py-2.5">
                                                        <p className="font-bold text-slate-900 text-xs break-words">{item.name || item.item_name}</p>
                                                        <p className="text-[8px] text-slate-700 mt-0.5 uppercase font-bold tracking-tight">HSN: {item.hsn_code || '-'}</p>
                                                    </td>
                                                    <td className="px-2 py-2.5 text-center font-black text-xs">{item.quantity}</td>
                                                    <td className="px-2 py-2.5 text-center font-bold text-slate-700 text-xs">₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}</td>
                                                    <td className="px-2 py-2.5 text-right font-black italic text-slate-900 text-xs">₹{(item.total || 0).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-between items-start pt-6 border-t-2 border-slate-100">
                                    <div className="max-w-[200px] space-y-4">
                                        {printSettings.show_bank_details && bankDetails && (
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <p className="font-black text-slate-700 uppercase text-[9px] tracking-widest">Bank Transfer Details</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px]">
                                                    <div>
                                                        <p className="text-slate-700 mb-0.5">Account Number</p>
                                                        <p className="font-black">{bankDetails.account_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-700 mb-0.5">IFSC Code</p>
                                                        <p className="font-black uppercase">{bankDetails.ifsc_code}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-slate-700 mb-0.5">Bank &amp; Branch Name</p>
                                                        <p className="font-black">{bankDetails.bank_branch_name}</p>
                                                    </div>
                                                    {bankDetails.account_holder_name && (
                                                        <div className="col-span-2">
                                                            <p className="text-slate-700 mb-0.5">Account Holder</p>
                                                            <p className="font-black">{bankDetails.account_holder_name}</p>
                                                        </div>
                                                    )}
                                                    {printSettings.show_upi_qr && bankDetails.upi_id && (
                                                        <div className="col-span-2">
                                                            <p className="text-slate-700 mb-0.5">UPI ID</p>
                                                            <p className="font-black text-blue-600">{bankDetails.upi_id}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {printSettings.show_terms && (
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Policy & Terms</p>
                                                <p className="text-[9px] text-slate-700 leading-tight italic opacity-80">{profile?.terms_and_conditions || 'Goods once sold will not be taken back.'}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-64 space-y-2 text-right ml-auto">
                                        <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-tight">
                                            <span>Subtotal</span>
                                            <span className="text-slate-900 font-black">₹{(invoice.subtotal || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-tight">
                                            <span>Tax Amt</span>
                                            <span className="text-slate-900 font-black">₹{(invoice.tax_total || invoice.gst_amount || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        {(invoice.transport_charges > 0 || invoice.installation_charges > 0) && (
                                            <div className="space-y-1 pt-1">
                                                {invoice.transport_charges > 0 && (
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-700 uppercase italic">
                                                        <span>Transport</span>
                                                        <span className="text-slate-900">₹{(invoice.transport_charges).toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                                {invoice.installation_charges > 0 && (
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-700 uppercase italic">
                                                        <span>Installation</span>
                                                        <span className="text-slate-900">₹{(invoice.installation_charges).toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {invoice.discount > 0 && (
                                            <div className="flex justify-between text-[11px] font-bold text-red-500 uppercase italic">
                                                <span>Discount</span>
                                                <span className="font-black">-₹{(invoice.discount).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-end pt-4 mt-2 border-t-2 border-slate-900">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Total Value</span>
                                            <span className="text-3xl font-black tracking-tighter italic text-slate-900">₹{(invoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
        </div>
    )
}
