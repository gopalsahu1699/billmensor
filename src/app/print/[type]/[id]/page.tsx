'use client'

import React, { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfessionalTemplate } from '@/components/print/ProfessionalTemplate'
import { CompactTemplate } from '@/components/print/CompactTemplate'
import { ModernTemplate } from '@/components/print/ModernTemplate'
import { InvoiceData, Profile, BankDetails, Item, Settings } from '@/types/print'

interface PrintParams {
    type: string
    id: string
}

export default function PrintDocumentPage({ params }: { params: Promise<PrintParams> }) {
    const { type, id } = use(params)
    const router = useRouter()

    const [data, setData] = useState<InvoiceData | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const [settings, setSettings] = useState<Settings & { print_template: string }>({
        print_template: 'modern',
        show_bank_details: true,
        show_terms: true,
        show_signature: true,
    })
    const [loading, setLoading] = useState(true)

    const fetchDocument = useCallback(async () => {
        try {
            setLoading(true)

            let tableName = ''
            let itemsTableName = ''
            let foreignKey = ''

            switch (type) {
                case 'invoices':
                case 'invoice':
                    tableName = 'invoices'
                    itemsTableName = 'invoice_items'
                    foreignKey = 'invoice_id'
                    break
                case 'quotations':
                case 'quotation':
                    tableName = 'quotations'
                    itemsTableName = 'quotation_items'
                    foreignKey = 'quotation_id'
                    break
                case 'delivery-challans':
                case 'challans':
                case 'challan':
                    tableName = 'delivery_challans'
                    itemsTableName = 'delivery_challan_items'
                    foreignKey = 'challan_id'
                    break
                case 'purchases':
                case 'purchase':
                    tableName = 'purchases'
                    itemsTableName = 'purchase_items'
                    foreignKey = 'purchase_id'
                    break
                case 'returns':
                case 'return':
                    tableName = 'returns'
                    itemsTableName = 'return_items'
                    foreignKey = 'return_id'
                    break
                default:
                    throw new Error('Invalid document type')
            }

            const { data: docData, error: docError } = await supabase
                .from(tableName as 'invoices' | 'quotations' | 'delivery_challans' | 'purchases' | 'returns')
                .select('*, customers(*), suppliers:supplier_id(*)')
                .eq('id', id)
                .single()

            if (docError) {
                console.error("fetchDocument docError on", tableName, id, docError)
                throw docError
            }

            // Normalize data for templates
            const normalizedData = {
                ...docData,
                customers: docData.customers || docData.suppliers
            }
            setData(normalizedData as InvoiceData)

            if (docData?.user_id) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', docData.user_id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setSettings({
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
                        .eq('user_id', docData.user_id)
                        .maybeSingle()

                    if (bankData) setBankDetails(bankData)
                }
            }

            const { data: itemsData, error: itemsError } = await supabase
                .from(itemsTableName as 'invoice_items' | 'quotation_items' | 'delivery_challan_items' | 'purchase_items' | 'return_items')
                .select('*')
                .eq(foreignKey, id)

            if (itemsError) {
                console.error("fetchDocument itemsError on", itemsTableName, id, itemsError)
                throw itemsError
            }
            if (itemsData) setItems(itemsData as Item[])

        } catch (error) {
            console.error('Failed to load document, caught error:', error)
            alert('Failed to load document for printing. Check console for details.')
        } finally {
            setLoading(false)
        }
    }, [type, id])

    useEffect(() => {
        fetchDocument()
    }, [fetchDocument])

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4" />
                <p className="text-slate-500 font-medium tracking-wide">Preparing document for print...</p>
            </div>
        )
    }

    if (!data || !profile) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold bg-slate-50">Document not found or access denied.</div>
    }

    const templateType = type.includes('invoice') ? 'invoice' :
        type.includes('quotation') ? 'quotation' :
            type.includes('purchase') ? 'purchase' :
                type.includes('return') ? 'return' :
                    type.includes('challan') ? 'challan' : 'invoice'

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-20">
            {/* NO-PRINT HEADER BAR */}
            <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl hover:bg-slate-100">
                        <ArrowLeft size={16} className="mr-2" /> Back
                    </Button>
                    <h1 className="text-[11px] font-black text-slate-800 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-lg">
                        Print Preview: {type}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleDownload} variant="outline" className="rounded-xl font-bold uppercase tracking-widest text-[11px] h-10 px-6 border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Download size={16} className="mr-2" /> PDF Export
                    </Button>
                    <Button onClick={handlePrint} className="rounded-xl font-black uppercase tracking-widest text-[11px] h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all">
                        <Printer size={16} className="mr-2" /> Print
                    </Button>
                </div>
            </div>

            {/* PRINT RENDER AREA */}
            <div className="pt-10 flex justify-center">
                <div id="clean-print-area" className="w-[210mm] print:w-full print:m-0 print:p-0 bg-white shadow-2xl print:shadow-none mx-auto overflow-hidden rounded-xl print:rounded-none border border-slate-200 print:border-none">
                    {settings.print_template === 'professional' ? (
                        <ProfessionalTemplate
                            data={data}
                            profile={profile}
                            bankDetails={bankDetails || undefined}
                            items={items}
                            settings={settings}
                            type={templateType as 'invoice' | 'quotation'}
                        />
                    ) : settings.print_template === 'compact' ? (
                        <CompactTemplate
                            data={data}
                            profile={profile}
                            bankDetails={bankDetails || undefined}
                            items={items}
                            settings={settings}
                            type={templateType as 'invoice' | 'quotation'}
                        />
                    ) : (
                        <ModernTemplate
                            data={data}
                            profile={profile}
                            bankDetails={bankDetails || undefined}
                            items={items}
                            settings={settings}
                            type={templateType as 'invoice' | 'quotation'}
                        />
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { background: white !important; margin: 0; padding: 0; overflow: visible !important; }
                    .no-print { display: none !important; }
                    #clean-print-area { width: 100% !important; box-shadow: none !important; margin: 0 !important; overflow: visible !important;}
                    *::-webkit-scrollbar { display: none !important; }
                }
            `}} />
        </div>
    )
}
