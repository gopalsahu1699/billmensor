'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CreateProductPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        description: '',
        sku: '',
        hsn_code: '',
        item_type: 'product',
        mrp: '',
        price: '',             // selling price
        purchase_price: '',
        wholesale_price: '',
        stock_quantity: '',
        tax_rate: '0',
        unit: 'pcs',
        image_url: '',
    })

    useEffect(() => {
        if (editId) fetchProduct()
    }, [editId])

    async function fetchProduct() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', editId)
                .single()

            if (error) throw error
            setForm({
                name: data.name || '',
                description: data.description || '',
                sku: data.sku || '',
                hsn_code: data.hsn_code || '',
                item_type: data.item_type || 'product',
                mrp: String(data.mrp || ''),
                price: String(data.price || ''),
                purchase_price: String(data.purchase_price || ''),
                wholesale_price: String(data.wholesale_price || ''),
                stock_quantity: String(data.stock_quantity || ''),
                tax_rate: String(data.tax_rate || '0'),
                unit: data.unit || 'pcs',
                image_url: data.image_url || '',
            })
        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/products')
        } finally {
            setFetching(false)
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const ext = file.name.split('.').pop()
            const fileName = `${userData.user.id}/products/${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('business-assets')
                .getPublicUrl(fileName)

            setForm(prev => ({ ...prev, image_url: urlData.publicUrl }))
            toast.success('Image uploaded')
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const productData = {
                name: form.name,
                description: form.description,
                sku: form.sku,
                hsn_code: form.hsn_code,
                item_type: form.item_type,
                mrp: parseFloat(form.mrp) || 0,
                price: parseFloat(form.price) || 0,
                purchase_price: parseFloat(form.purchase_price) || 0,
                wholesale_price: parseFloat(form.wholesale_price) || 0,
                stock_quantity: parseInt(form.stock_quantity) || 0,
                tax_rate: parseFloat(form.tax_rate) || 0,
                unit: form.unit,
                image_url: form.image_url,
                user_id: userData.user.id,
            }

            if (editId) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editId)
                if (error) throw error
                toast.success('Product updated successfully')
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData])
                if (error) throw error
                toast.success('Product added successfully')
            }
            router.push('/dashboard/products')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-medium">Loading product details...</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">
                        {editId ? 'Update Product' : 'Register New Product'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {editId ? 'Modify product pricing, stock, and details.' : 'Add a new item to your inventory catalog.'}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 space-y-7">

                    {/* Image Upload + Item Type Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Product Image</label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {form.image_url ? (
                                        <img src={form.image_url} alt="Product" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[32px] text-slate-300">image</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                        {uploading ? 'Uploading...' : 'Choose File'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                    {form.image_url && (
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, image_url: '' })}
                                            className="text-[10px] text-red-500 font-bold hover:underline text-left"
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                    <p className="text-[10px] text-slate-400">JPG, PNG. Max 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Item Type */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Item Type *</label>
                            <div className="flex gap-3 mt-2">
                                {[
                                    { value: 'product', icon: 'inventory', label: 'Product' },
                                    { value: 'service', icon: 'handyman', label: 'Service' },
                                ].map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, item_type: t.value })}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.item_type === t.value
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Product / Service Name *</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">inventory</span>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="e.g. Wireless Mouse, IT Consulting"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">description</span>
                            <textarea
                                rows={2}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="Short product description..."
                            />
                        </div>
                    </div>

                    {/* SKU and HSN / SAC Code */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">SKU Code</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">qr_code_2</span>
                                <input
                                    value={form.sku}
                                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono"
                                    placeholder="SKU-001"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">HSN / SAC Code</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">tag</span>
                                <input
                                    value={form.hsn_code}
                                    onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono"
                                    placeholder={form.item_type === 'service' ? 'SAC: 998314' : 'HSN: 8471'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider: Pricing Section */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                            Pricing Details
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {/* MRP */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">sell</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.mrp}
                                        onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="999.00"
                                    />
                                </div>
                            </div>

                            {/* Selling Price */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Selling Price (₹) *</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">storefront</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-green-500/20 transition-all outline-none text-green-800 dark:text-green-200 placeholder:text-green-400 font-bold"
                                        placeholder="749.00"
                                    />
                                </div>
                            </div>

                            {/* Purchase Price */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Purchase Price (₹)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">shopping_cart</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.purchase_price}
                                        onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="500.00"
                                    />
                                </div>
                            </div>

                            {/* Wholesale Price */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Wholesale (₹)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">warehouse</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.wholesale_price}
                                        onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="650.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Tax */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">shelves</span>
                            Stock & Tax
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">shelves</span>
                                    <input
                                        type="number"
                                        value={form.stock_quantity}
                                        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">GST Rate (%)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">percent</span>
                                    <select
                                        value={form.tax_rate}
                                        onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 appearance-none"
                                    >
                                        <option value="0">0% (Exempt)</option>
                                        <option value="5">5% GST</option>
                                        <option value="12">12% GST</option>
                                        <option value="18">18% GST</option>
                                        <option value="28">28% GST</option>
                                    </select>
                                </div>
                            </div>
                            {/* Unit */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                                <div className="flex gap-2 flex-wrap mt-1">
                                    {['pcs', 'kg', 'ltr', 'mtr', 'box', 'set', 'nos', 'hrs'].map((u) => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => setForm({ ...form, unit: u })}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.unit === u
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <Link href="/dashboard/products">
                        <button type="button" className="px-8 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all">
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">{editId ? 'verified' : 'save'}</span>
                        {loading ? 'Processing...' : (editId ? 'Update Product' : 'Save Product')}
                    </button>
                </div>
            </form>
        </div>
    )
}
