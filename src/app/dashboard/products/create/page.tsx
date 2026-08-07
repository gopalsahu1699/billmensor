'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartInput, SmartTextarea, SmartSelect, SmartNumberInput } from '@/components/ui/form/smart-inputs'
import { validateRequired, validatePositiveNumber } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { generateEAN13, validateEAN13 } from '@/lib/barcode'
import { UNIT_GROUPS, ALL_UNITS } from '@/lib/constants'

interface ProductForm {
    name: string
    description: string
    warranty: string
    sku: string
    hsn_code: string
    item_type: string
    mrp: string
    price: string
    purchase_price: string
    wholesale_price: string
    stock_quantity: string
    opening_stock_value: string
    tax_rate: string
    unit: string
    image_url: string
    barcode: string
    batch_number: string
    expiry_date: string
    mfg_date: string
    reorder_point: string
    is_low_stock_alert: boolean
}

const DEFAULT_FORM: ProductForm = {
    name: '',
    description: '',
    warranty: '',
    sku: '',
    hsn_code: '',
    item_type: 'product',
    mrp: '',
    price: '',
    purchase_price: '',
    wholesale_price: '',
    stock_quantity: '',
    opening_stock_value: '',
    tax_rate: '18',
    unit: 'pcs',
    image_url: '',
    barcode: '',
    batch_number: '',
    expiry_date: '',
    mfg_date: '',
    reorder_point: '5',
    is_low_stock_alert: true,
}

const STRING_KEYS = Object.keys(DEFAULT_FORM).filter(
    (k) => k !== 'is_low_stock_alert'
) as (keyof ProductForm)[]

function fieldError(key: keyof ProductForm, f: ProductForm): string | undefined {
    switch (key) {
        case 'name':
            return f.name.trim() ? undefined : 'Please enter the product name.'
        case 'price':
            return validateRequired(f.price, 'price') ?? validatePositiveNumber(f.price, 'Price') ?? undefined
        case 'mrp':
            return validatePositiveNumber(f.mrp, 'MRP') ?? undefined
        case 'purchase_price':
            return validatePositiveNumber(f.purchase_price, 'purchase price') ?? undefined
        case 'wholesale_price':
            return validatePositiveNumber(f.wholesale_price, 'wholesale price') ?? undefined
        case 'stock_quantity':
            return validatePositiveNumber(f.stock_quantity, 'stock quantity') ?? undefined
        case 'opening_stock_value':
            return validatePositiveNumber(f.opening_stock_value, 'opening stock value') ?? undefined
        case 'reorder_point':
            return validatePositiveNumber(f.reorder_point, 'reorder point') ?? undefined
        case 'barcode':
            return f.barcode.trim()
                ? validateEAN13(f.barcode.trim())
                    ? undefined
                    : 'Enter a valid 13-digit EAN-13 barcode.'
                : undefined
        default:
            return undefined
    }
}

export default function CreateProductPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState<ProductForm>(DEFAULT_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({})
    const [dirty, setDirty] = useState(false)
    const { confirmLeave } = useUnsavedChanges(dirty)

    const update = (key: (typeof STRING_KEYS)[number], value: string) => {
        setForm((f) => ({ ...f, [key]: value }))
        setDirty(true)
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const updateNumber = (key: (typeof STRING_KEYS)[number], value: number | undefined) => {
        setForm((f) => ({ ...f, [key]: value === undefined ? '' : String(value) }))
        setDirty(true)
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: keyof ProductForm) => {
        const msg = fieldError(key, form)
        setErrors((e) => ({ ...e, [key]: msg ?? '' }))
    }

    const fetchProduct = useCallback(async () => {
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
                warranty: data.warranty || '',
                sku: data.sku || '',
                hsn_code: data.hsn_code || '',
                item_type: data.item_type || 'product',
                mrp: String(data.mrp || ''),
                price: String(data.price || ''),
                purchase_price: String(data.purchase_price || ''),
                wholesale_price: String(data.wholesale_price || ''),
                stock_quantity: String(data.stock_quantity || ''),
                opening_stock_value: String(data.opening_stock_value || ''),
                tax_rate: String(data.tax_rate || '0'),
                unit: data.unit || 'pcs',
                image_url: data.image_url || '',
                barcode: data.barcode || '',
                batch_number: data.batch_number || '',
                expiry_date: data.expiry_date || '',
                mfg_date: data.mfg_date || '',
                reorder_point: String(data.reorder_point || ''),
                is_low_stock_alert: data.is_low_stock_alert !== false,
            })
        } catch (error: unknown) {
            toast.error(friendlyError(error))
            router.push('/dashboard/products')
        } finally {
            setFetching(false)
        }
    }, [editId, router])

    useEffect(() => {
        if (editId) fetchProduct()
    }, [editId, fetchProduct])

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
            setDirty(true)
            toast.success('Image uploaded')
        } catch (error: unknown) {
            toast.error(friendlyError(error, 'Upload failed. Please try again.'))
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveImage = () => {
        setForm((f) => ({ ...f, image_url: '' }))
        setDirty(true)
    }

    const selectItemType = (value: string) => {
        setForm((f) => ({ ...f, item_type: value }))
        setDirty(true)
    }

    const selectUnit = (value: string) => {
        setForm((f) => ({ ...f, unit: value }))
        setDirty(true)
    }

    const toggleLowStockAlert = () => {
        setForm((f) => ({ ...f, is_low_stock_alert: !f.is_low_stock_alert }))
        setDirty(true)
    }

    const handleGenerateBarcode = () => {
        const code = generateEAN13('890')
        setForm((f) => ({ ...f, barcode: code }))
        setDirty(true)
        setErrors((e) => (e.barcode ? { ...e, barcode: '' } : e))
        toast.success('EAN-13 barcode generated')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const validationErrors: Partial<Record<keyof ProductForm, string>> = {}
        STRING_KEYS.forEach((key) => {
            const msg = fieldError(key, form)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const productData = {
                name: form.name,
                description: form.description,
                warranty: form.warranty || null,
                sku: form.sku,
                hsn_code: form.hsn_code,
                item_type: form.item_type,
                mrp: parseFloat(form.mrp) || 0,
                price: parseFloat(form.price) || 0,
                purchase_price: parseFloat(form.purchase_price) || 0,
                wholesale_price: parseFloat(form.wholesale_price) || 0,
                stock_quantity: parseInt(form.stock_quantity) || 0,
                opening_stock_value: parseFloat(form.opening_stock_value) || 0,
                tax_rate: parseFloat(form.tax_rate) || 0,
                unit: form.unit,
                image_url: form.image_url,
                user_id: userData.user.id,
                barcode: form.barcode || null,
                batch_number: form.batch_number || null,
                expiry_date: form.expiry_date || null,
                mfg_date: form.mfg_date || null,
                reorder_point: parseInt(form.reorder_point) || 0,
                is_low_stock_alert: form.is_low_stock_alert,
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
            setSaved(true)
            setDirty(false)
            setTimeout(() => router.push('/dashboard/products'), 500)
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (!confirmLeave()) return
        router.push('/dashboard/products')
    }

    if (fetching) {
        return (
            <div className="max-w-5xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading product details...</p>
            </div>
        )
    }

    const itemTypes = [
        { value: 'product', icon: 'inventory', label: 'Product' },
        { value: 'service', icon: 'handyman', label: 'Service' },
    ]
    const CUSTOM_UNIT = '__custom__'
    const isCustomUnit = !ALL_UNITS.includes(form.unit)
    const unitSelectValue = isCustomUnit ? CUSTOM_UNIT : form.unit
    const taxRates = [
        { value: '0', label: '0% (Exempt)' },
        { value: '5', label: '5% GST' },
        { value: '12', label: '12% GST' },
        { value: '18', label: '18% GST' },
        { value: '28', label: '28% GST' },
    ]

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-slate-900 dark:bg-primary/5 p-6 md:p-10 rounded-[32px] text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <Link href="/dashboard/products" aria-label="Back to products">
                        <button
                            type="button"
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-white">arrow_back</span>
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
                            {editId ? 'Update' : 'Register'} <span className="text-primary">Product</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">
                            {editId ? 'Modify product pricing, stock, and details.' : 'Add a new item to your inventory catalog.'}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
                    Required fields are marked with *
                </div>
            </div>

            <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                <FormSection
                    title="Product identity"
                    description="Core details, image, and classification of this item."
                    icon={<span className="material-symbols-outlined text-[22px]" aria-hidden="true">inventory_2</span>}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Product image" description="Upload a photo of the product for quick identification.">
                            {() => (
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                        {form.image_url ? (
                                            <Image
                                                src={form.image_url}
                                                alt="Product image preview"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-[32px] text-slate-300" aria-hidden="true">image</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
                                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">cloud_upload</span>
                                            {uploading ? 'Uploading...' : 'Choose File'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploading}
                                                aria-label="Choose product image"
                                            />
                                        </label>
                                        {form.image_url && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="text-[10px] text-red-500 font-bold hover:underline text-left"
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                        <p className="text-[10px] text-slate-400">JPG, PNG. Max 2MB.</p>
                                    </div>
                                </div>
                            )}
                        </FormField>

                        <FormField label="Item type" required>
                            {({ labelId }) => (
                                <div role="radiogroup" aria-labelledby={labelId} className="flex gap-3 mt-1">
                                    {itemTypes.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={form.item_type === t.value}
                                            onClick={() => selectItemType(t.value)}
                                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${form.item_type === t.value
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </FormField>
                    </div>

                    <FormField label="Product / service name" required error={errors.name}>
                        {({ id, describedBy, invalid }) => (
                            <SmartInput
                                id={id}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                invalid={invalid}
                                icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">inventory</span>}
                                placeholder="e.g. Wireless Mouse, IT Consulting"
                                maxLength={120}
                                transform="words"
                                trimOnBlur
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                onBlur={() => blurValidate('name')}
                            />
                        )}
                    </FormField>

                    <FormField label="Description">
                        {({ id, describedBy }) => (
                            <SmartTextarea
                                id={id}
                                aria-describedby={describedBy}
                                rows={2}
                                placeholder="Short product description..."
                                maxLength={500}
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                            />
                        )}
                    </FormField>

                    <FormField label="Warranty details">
                        {({ id, describedBy }) => (
                            <SmartTextarea
                                id={id}
                                aria-describedby={describedBy}
                                rows={2}
                                placeholder="e.g. 1 year manufacturer warranty, replacement within 7 days..."
                                maxLength={300}
                                value={form.warranty}
                                onChange={(e) => update('warranty', e.target.value)}
                            />
                        )}
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="SKU code" hint={form.sku ? `${form.sku.length}/40` : 'Optional'}>
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_2</span>}
                                    placeholder="SKU-001"
                                    maxLength={40}
                                    trimOnBlur
                                    className="font-mono"
                                    value={form.sku}
                                    onChange={(e) => update('sku', e.target.value)}
                                    onBlur={() => blurValidate('sku')}
                                />
                            )}
                        </FormField>
                        <FormField label="HSN / SAC code">
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">tag</span>}
                                    placeholder={form.item_type === 'service' ? 'SAC: 998314' : 'HSN: 8471'}
                                    maxLength={12}
                                    trimOnBlur
                                    className="font-mono"
                                    value={form.hsn_code}
                                    onChange={(e) => update('hsn_code', e.target.value)}
                                    onBlur={() => blurValidate('hsn_code')}
                                />
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Pricing details"
                    description="Prices displayed on invoices, quotations, and the point of sale."
                    icon={<span className="material-symbols-outlined text-[22px]" aria-hidden="true">payments</span>}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FormField label="MRP" error={errors.mrp}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="999.00"
                                    value={form.mrp}
                                    onValueChange={(v) => updateNumber('mrp', v)}
                                    onBlur={() => blurValidate('mrp')}
                                />
                            )}
                        </FormField>

                        <FormField
                            label="Selling price"
                            required
                            description="Including GST. The price shown to customers."
                            error={errors.price}
                        >
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="749.00"
                                    value={form.price}
                                    onValueChange={(v) => updateNumber('price', v)}
                                    onBlur={() => blurValidate('price')}
                                />
                            )}
                        </FormField>

                        <FormField label="Purchase price" error={errors.purchase_price}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="500.00"
                                    value={form.purchase_price}
                                    onValueChange={(v) => updateNumber('purchase_price', v)}
                                    onBlur={() => blurValidate('purchase_price')}
                                />
                            )}
                        </FormField>

                        <FormField label="Wholesale price" error={errors.wholesale_price}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="650.00"
                                    value={form.wholesale_price}
                                    onValueChange={(v) => updateNumber('wholesale_price', v)}
                                    onBlur={() => blurValidate('wholesale_price')}
                                />
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Stock & tax"
                    description="Inventory levels, GST rate, and reorder alerts."
                    icon={<span className="material-symbols-outlined text-[22px]" aria-hidden="true">shelves</span>}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FormField label="Stock quantity" error={errors.stock_quantity} hint="Units currently in inventory.">
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">shelves</span>}
                                    decimals={0}
                                    min={0}
                                    showSteppers
                                    placeholder="50"
                                    value={form.stock_quantity}
                                    onValueChange={(v) => updateNumber('stock_quantity', v)}
                                    onBlur={() => blurValidate('stock_quantity')}
                                />
                            )}
                        </FormField>

                        <FormField label="Opening stock value" error={errors.opening_stock_value}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="5000.00"
                                    value={form.opening_stock_value}
                                    onValueChange={(v) => updateNumber('opening_stock_value', v)}
                                    onBlur={() => blurValidate('opening_stock_value')}
                                />
                            )}
                        </FormField>

                        <FormField label="GST rate (%)">
                            {({ id, describedBy }) => (
                                <SmartSelect
                                    id={id}
                                    aria-describedby={describedBy}
                                    value={form.tax_rate}
                                    onChange={(e) => update('tax_rate', e.target.value)}
                                >
                                    {taxRates.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </SmartSelect>
                            )}
                        </FormField>

                        <FormField label="Unit">
                            {({ id, describedBy }) => (
                                <div className="space-y-3">
                                    <SmartSelect
                                        id={id}
                                        aria-describedby={describedBy}
                                        value={unitSelectValue}
                                        onChange={(e) => selectUnit(e.target.value === CUSTOM_UNIT ? '' : e.target.value)}
                                    >
                                        {UNIT_GROUPS.map((g) => (
                                            <optgroup key={g.label} label={g.label}>
                                                {g.values.map((u) => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        <optgroup label="Other">
                                            <option value={CUSTOM_UNIT}>Custom…</option>
                                        </optgroup>
                                    </SmartSelect>
                                    {isCustomUnit && (
                                        <SmartInput
                                            placeholder="Enter custom unit (e.g. sqft, metre, inch)"
                                            value={form.unit}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, unit: e.target.value }))
                                                setDirty(true)
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </FormField>

                        <FormField label="Reorder point" description="Get alerted when stock falls to this level." error={errors.reorder_point}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">notification_important</span>}
                                    decimals={0}
                                    min={0}
                                    showSteppers
                                    placeholder="5"
                                    value={form.reorder_point}
                                    onValueChange={(v) => updateNumber('reorder_point', v)}
                                    onBlur={() => blurValidate('reorder_point')}
                                />
                            )}
                        </FormField>

                        <FormField label="Low stock alert" description="Notify when stock drops below the reorder point.">
                            {() => (
                                <div className="flex items-center gap-3 mt-1">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.is_low_stock_alert}
                                        aria-label="Low stock alert"
                                        onClick={toggleLowStockAlert}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.is_low_stock_alert ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.is_low_stock_alert ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                        {form.is_low_stock_alert ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Barcode, batch & expiry"
                    description="Tracking codes and dates for lot-level inventory control."
                    icon={<span className="material-symbols-outlined text-[22px]" aria-hidden="true">qr_code</span>}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                            label="Barcode (EAN-13)"
                            description="Auto-generate a valid EAN-13 code (India prefix 890) or enter your own 13-digit code."
                            error={errors.barcode}
                        >
                            {({ id, describedBy, invalid }) => (
                                <div className="flex gap-2">
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        inputMode="numeric"
                                        maxLength={13}
                                        className="font-mono"
                                        placeholder="8900000000000"
                                        value={form.barcode}
                                        onChange={(e) => update('barcode', e.target.value.replace(/\D/g, ''))}
                                        onBlur={() => blurValidate('barcode')}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateBarcode}
                                        aria-label="Generate a new EAN-13 barcode"
                                        title="Generate EAN-13 barcode"
                                        className="shrink-0 h-12 w-12 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">refresh</span>
                                    </button>
                                </div>
                            )}
                        </FormField>

                        <FormField label="Batch number">
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">inventory_2</span>}
                                    placeholder="BATCH-001"
                                    maxLength={40}
                                    trimOnBlur
                                    value={form.batch_number}
                                    onChange={(e) => update('batch_number', e.target.value)}
                                    onBlur={() => blurValidate('batch_number')}
                                />
                            )}
                        </FormField>

                        <FormField label="Manufacturing date">
                            {({ id, describedBy }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    type="date"
                                    value={form.mfg_date}
                                    onChange={(e) => update('mfg_date', e.target.value)}
                                />
                            )}
                        </FormField>

                        <FormField label="Expiry date">
                            {({ id, describedBy }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    type="date"
                                    value={form.expiry_date}
                                    onChange={(e) => update('expiry_date', e.target.value)}
                                />
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormActions
                    formId="product-form"
                    onCancel={handleCancel}
                    saving={loading}
                    success={saved}
                    dirty={dirty}
                    saveLabel={editId ? 'Update product' : 'Save product'}
                />
            </form>
        </div>
    )
}
