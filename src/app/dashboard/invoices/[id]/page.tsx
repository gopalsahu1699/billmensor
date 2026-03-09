'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { MdArrowBack, MdDownload, MdRefresh, MdDashboard, MdMail, MdCheckCircle, MdShare, MdDelete, MdEdit, MdDescription } from 'react-icons/md'
import { FaWhatsapp } from 'react-icons/fa'
import { toast } from 'sonner'
import Link from 'next/link'
import { ProfessionalTemplate } from '@/components/print/ProfessionalTemplate'
import { CompactTemplate } from '@/components/print/CompactTemplate'
import { ModernTemplate } from '@/components/print/ModernTemplate'
import { downloadPDF, sharePDF } from '@/lib/pdf-service'

import { InvoiceData, Profile, BankDetails, Item, Settings } from '@/types/print'


export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [invoice, setInvoice] = useState<InvoiceData | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [printSettings, setPrintSettings] = useState<Settings & { print_template: string }>({
        print_template: 'modern',
        show_bank_details: true,
        show_terms: true,
        show_signature: true,
    })


    useEffect(() => {
        // Add print-specific styles
        const style = document.createElement('style')
        style.innerHTML = `
            @media print {
                nav, aside, button, .no-print, .action-sidebar { display: none !important; }
                body { background: white !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
                .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                main { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
                .shadow-xl, .shadow-2xl, .shadow-md { box-shadow: none !important; border: none !important; }
                .rounded-[48px], .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                .bg-slate-50\/50 { background-color: transparent !important; }
                #invoice-render-area * { color: #000 !important; }
                * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                *::-webkit-scrollbar { display: none !important; }
                @page { margin: 1cm; }
            }
        `
        document.head.appendChild(style)
        return () => { document.head.removeChild(style) }
    }, [])

    const fetchInvoiceDetails = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('invoices')
                .select('*, customers (*)')
                .eq('id', id)
                .single()

            if (error) throw error
            setInvoice(data)

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user_id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setPrintSettings({
                    print_template: profileData.print_template || 'modern',
                    show_bank_details: profileData.show_bank_details ?? true,
                    show_terms: profileData.show_terms ?? true,
                    show_signature: profileData.show_signature ?? true,
                    show_custom_fields: profileData.show_custom_fields ?? true,
                    show_upi_qr: profileData.show_upi_qr ?? true,
                    show_transport: profileData.show_transport ?? true,
                    show_installation: profileData.show_installation ?? true,
                })


                const { data: bankData } = await supabase
                    .from('company_bank_details')
                    .select('*')
                    .eq('user_id', data.user_id)
                    .maybeSingle()
                if (bankData) setBankDetails(bankData)
            }

            const { data: itemsData, error: itemsError } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', id)

            if (itemsError) throw itemsError
            setItems(itemsData || [])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch invoice'
            toast.error(message)
            router.push('/dashboard/invoices')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchInvoiceDetails()
    }, [fetchInvoiceDetails])


    async function handleMarkAsPaid() {
        try {
            if (!invoice) return
            const { error } = await supabase
                .from('invoices')
                .update({ payment_status: 'paid', amount_paid: invoice.total_amount, balance_amount: 0 })
                .eq('id', id)

            if (error) throw error
            toast.success('Invoice marked as paid')
            fetchInvoiceDetails()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Action failed'
            toast.error(message)
        }
    }


    async function handleShare() {
        if (!invoice) return
        try {
            setSharing(true)
            await sharePDF({
                elementId: 'invoice-render-area',
                filename: `${invoice.invoice_number}.pdf`,
                title: `Invoice ${invoice.invoice_number}`,
                text: `Please find attached the invoice ${invoice.invoice_number} from ${profile?.company_name || 'Billmensor'}`
            })
        } finally {
            setSharing(false)
        }
    }


    const handleEmail = () => {
        if (!invoice) return
        const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} from ${profile?.company_name || 'Billmensor'}`)
        const body = encodeURIComponent(`Hello,\n\nPlease find the invoice details for ${invoice.invoice_number} at the following link:\n\n${window.location.href}\n\nTotal Amount: ₹${invoice.total_amount.toLocaleString('en-IN')}\n\nThank you,\n${profile?.company_name || 'Billmensor'}`)
        window.location.href = `mailto:${invoice.customers?.email || ''}?subject=${subject}&body=${body}`
    }

    const handleWhatsAppShare = () => {
        if (!invoice) return

        const companyName = profile?.company_name || 'Billmensor'
        const customerName = invoice.customers?.name || 'Customer'
        const printUrl = `${window.location.origin}/print/invoices/${invoice.id}`

        let message = `Hello ${customerName},\n\nPlease find your invoice *${invoice.invoice_number}* from *${companyName}* for the amount of *₹${invoice.total_amount.toLocaleString('en-IN')}*.\n\nYou can view and download your professional invoice here:\n${printUrl}\n\nThank you for your business!`

        const encodedMessage = encodeURIComponent(message)
        const phone = invoice.customers?.phone?.replace(/\D/g, '')

        let whatsappUrl = ''
        if (phone && phone.length >= 10) {
            const formattedPhone = phone.length === 10 ? `91${phone}` : phone
            whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
        } else {
            whatsappUrl = `https://wa.me/?text=${encodedMessage}`
        }

        window.open(whatsappUrl, '_blank')
    }


    async function handleDownload() {
        if (!invoice) return
        await downloadPDF({
            elementId: 'invoice-render-area',
            filename: `${invoice.invoice_number}.pdf`
        })
    }






    async function handleDelete() {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

        try {
            setLoading(true)
            const { error: itemsError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoice_id', id)

            if (itemsError) throw itemsError

            const { error: invoiceError } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id)

            if (invoiceError) throw invoiceError

            toast.success('Invoice deleted successfully')
            router.push('/dashboard/invoices')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Delete failed'
            toast.error(message)
            setLoading(false)
        }
    }


    if (loading) {
        return (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
                <MdRefresh className="animate-spin text-blue-600 w-10 h-10" />
                <p className="text-slate-500 font-medium">Loading professional workspace...</p>
            </div>
        )
    }

    if (!invoice || !profile) return null


    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
                        <MdArrowBack size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Invoices</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Invoice Details</h1>
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
                            <MdCheckCircle size={18} /> Mark as Paid
                        </Button>
                    )}
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                            className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <MdDashboard size={18} /> {printSettings.print_template} Template
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
                        {sharing ? <MdRefresh size={18} className="animate-spin" /> : <MdShare size={18} />}
                        {sharing ? 'Sharing...' : 'Share'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleWhatsAppShare}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-green-200 text-green-600 hover:bg-green-50 transition-all shadow-sm"
                    >
                        <FaWhatsapp size={18} /> WhatsApp
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleEmail}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <MdMail size={18} /> Email
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/invoices/create?edit=${id}`)}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <MdEdit size={18} /> Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-red-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                    >
                        <MdDelete size={18} /> Delete
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <MdDownload size={18} /> Download
                    </Button>
                </div>
            </div>

            <div className="flex justify-center w-full overflow-x-auto pb-8 custom-scrollbar">
                {/* Main Content Area */}
                <div id="invoice-render-area" className="w-198.5 shrink-0 space-y-8 print:w-full">
                    {/* Template Rendering */}
                    {printSettings.print_template === 'professional' ? (
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
                            <ProfessionalTemplate
                                data={invoice}
                                profile={profile}
                                bankDetails={bankDetails || undefined}
                                items={items}
                                settings={printSettings}
                                type="invoice"
                            />
                        </div>
                    ) : printSettings.print_template === 'compact' ? (
                        <div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
                            <CompactTemplate
                                data={invoice}
                                profile={profile}
                                bankDetails={bankDetails || undefined}
                                items={items}
                                settings={printSettings}
                                type="invoice"
                            />

                        </div>
                    ) : (
                        <ModernTemplate
                            data={invoice}
                            profile={profile}
                            bankDetails={bankDetails || undefined}
                            items={items}
                            settings={printSettings}
                            type="invoice"
                        />
                    )}

                </div>

            </div>
        </div>
    )
}
