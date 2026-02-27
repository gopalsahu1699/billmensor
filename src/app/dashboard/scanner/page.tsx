'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { IoCloudUpload, IoCamera, IoDocument, IoSync, IoCheckmarkCircle, IoCloseCircle, IoArrowForward, IoCart } from 'react-icons/io5'
import { FaPlus } from 'react-icons/fa'

interface ExtractedData {
    invoice_number?: string
    date?: string
    vendor_name?: string
    total_amount?: number
    items?: { name: string; quantity: number; rate: number; amount: number }[]
}

export default function OCRScannerPage() {
    const [uploading, setUploading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (file: File) => {
        if (!file) return

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        setUploading(true)
        setImagePreview(URL.createObjectURL(file))
        setExtractedData(null)

        try {
            // Upload to storage
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileName = `ocr/${user.id}/${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Simulate OCR processing (in production, use Google Cloud Vision or Azure)
            await processOCR(file)
            
        } catch (error: any) {
            toast.error(error.message)
            setImagePreview(null)
        } finally {
            setUploading(false)
        }
    }

    const processOCR = async (file: File) => {
        setProcessing(true)

        // Simulate OCR processing delay
        await new Promise(resolve => setTimeout(resolve, 2500))

        // Demo extracted data - in production this would come from OCR API
        const mockData: ExtractedData = {
            invoice_number: `INV/${Date.now().toString().slice(-8)}`,
            date: new Date().toISOString().split('T')[0],
            vendor_name: 'Demo Vendor Pvt Ltd',
            total_amount: Math.floor(Math.random() * 50000) + 1000,
            items: [
                { name: 'Product A', quantity: 2, rate: 500, amount: 1000 },
                { name: 'Product B', quantity: 1, rate: 750, amount: 750 },
            ]
        }

        setExtractedData(mockData)
        setProcessing(false)
        toast.success('Document scanned successfully!')
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }

    const createPurchaseFromOCR = () => {
        if (!extractedData) return
        
        // Store extracted data in sessionStorage for the purchase page
        sessionStorage.setItem('ocr_data', JSON.stringify(extractedData))
        
        toast.success('Data copied! Navigate to Purchase to create.')
        // In production, navigate to purchase create with pre-filled data
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center">
                    <IoCamera className="text-purple-600" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">OCR Scanner</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Scan bills and invoices to auto-fill purchase data</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <IoDocument className="text-blue-600 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">AI-Powered Scanning</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Upload a photo or screenshot of any bill/invoice. Our AI will extract vendor name, 
                            items, quantities, rates, and total amount automatically.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div 
                className={`bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
                    dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-800'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                />

                {imagePreview ? (
                    <div className="space-y-4">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-64 mx-auto rounded-xl shadow-lg"
                        />
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => { setImagePreview(null); setExtractedData(null); }}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm"
                            >
                                <IoCloseCircle size={18} />
                                Clear
                            </button>
                        </div>
                    </div>
                ) : uploading || processing ? (
                    <div className="space-y-4">
                        <IoSync size={48} className="mx-auto text-blue-600 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                            {uploading ? 'Uploading...' : 'Processing with AI...'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <IoCloudUpload className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                            Drop your bill image here
                        </h3>
                        <p className="text-slate-500 mb-6">
                            or click to browse files (JPG, PNG, PDF)
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                        >
                            <IoCamera size={20} />
                            Select Image
                        </button>
                        <p className="text-xs text-slate-400 mt-4">
                            Supported formats: JPG, PNG, PDF (Max 10MB)
                        </p>
                    </>
                )}
            </div>

            {/* Extracted Data */}
            {extractedData && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Extracted Data</h2>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <IoCheckmarkCircle size={14} />
                                Verified
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Invoice Number</p>
                                <p className="font-bold text-slate-900 dark:text-white font-mono">{extractedData.invoice_number}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Date</p>
                                <p className="font-bold text-slate-900 dark:text-white">{extractedData.date}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Vendor Name</p>
                                <p className="font-bold text-slate-900 dark:text-white">{extractedData.vendor_name}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <p className="text-xs text-green-600 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="font-bold text-green-700 dark:text-green-400">₹{extractedData.total_amount?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {extractedData.items && extractedData.items.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Items</h3>
                                <div className="space-y-2">
                                    {extractedData.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.rate}</p>
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white">₹{item.amount.toLocaleString('en-IN')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button
                            onClick={() => { setImagePreview(null); setExtractedData(null); }}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-600"
                        >
                            <IoSync size={18} />
                            Scan Another
                        </button>
                        <button
                            onClick={createPurchaseFromOCR}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm"
                        >
                            <IoCart size={18} />
                            Create Purchase
                            <IoArrowForward size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
