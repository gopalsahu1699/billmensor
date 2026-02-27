'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MdAdd, MdSearch, MdVisibility, MdEdit, MdDelete, MdOpenInNew, MdShoppingBag, MdInventory, MdShare, MdQrCode, MdContentCopy, MdCheckCircle } from 'react-icons/md'

interface OnlineProduct {
    id: string
    product_id: string
    products?: { name: string; price: number; image_url?: string }
    is_active: boolean
    created_at: string
}

interface StoreProduct {
    id: string
    name: string
    price: number
    image_url?: string
    stock_quantity?: number
}

export default function OnlineStorePage() {
    const [products, setProducts] = useState<OnlineProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([])
    const [selectedProduct, setSelectedProduct] = useState('')

    useEffect(() => {
        fetchOnlineProducts()
        fetchAllProducts()
    }, [])

    async function fetchOnlineProducts() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // This would be a separate table for online store products
            // For now, we'll simulate it
            setProducts([])
        } catch (error: any) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchAllProducts() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('products')
                .select('id, name, price, image_url, stock_quantity')
                .eq('user_id', user.id)
                .eq('item_type', 'product')
                .order('name')

            setAllProducts(data || [])
        } catch (error: any) {
            console.error(error)
        }
    }

    const storeUrl = 'https://your-store.billmensor.app'

    const copyStoreLink = () => {
        navigator.clipboard.writeText(storeUrl)
        toast.success('Store link copied!')
    }

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pink-600/10 rounded-2xl flex items-center justify-center">
                        <MdShoppingBag className="text-pink-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Online Store</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Create your online store and share with customers</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-pink-600/20"
                >
                    <MdAdd size={20} />
                    Add Product
                </button>
            </div>

            {/* Store Info Card */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-8 text-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black mb-2">Your Online Store</h2>
                        <p className="text-pink-100">Share this link with your customers to receive orders</p>
                    </div>
                                <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-2">
                            <MdOpenInNew size={20} />
                            <span className="font-mono">{storeUrl}</span>
                        </div>
                        <button
                            onClick={copyStoreLink}
                            className="bg-white text-pink-600 px-4 py-3 rounded-xl font-bold hover:bg-pink-50 transition-colors"
                        >
                            <MdContentCopy size={20} />
                        </button>
                        <a
                            href={storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-pink-600 px-4 py-3 rounded-xl font-bold hover:bg-pink-50 transition-colors"
                        >
                            <MdVisibility size={20} />
                        </a>
                    </div>
                </div>

                {/* QR Code */}
                <div className="mt-8 flex items-center gap-4">
                    <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center">
                            <MdQrCode size={48} className="text-pink-600" />
                    </div>
                    <div>
                        <h3 className="font-bold">Scan to Open Store</h3>
                        <p className="text-sm text-pink-100">Customers can scan this QR code to view your products</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                                    <MdInventory className="text-pink-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Total Products</p>
                            <p className="text-xl font-black">{allProducts.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <MdCheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Active Listings</p>
                            <p className="text-xl font-black">{products.filter(p => p.is_active).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <MdShare className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Store Visits</p>
                            <p className="text-xl font-black">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Store Products</h2>
                </div>

                        {allProducts.length === 0 ? (
                    <div className="py-20 text-center">
                        <MdShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products available</h3>
                        <p className="text-slate-500 mt-1">Add products to your inventory to list them in your store</p>
                        <Link href="/dashboard/products/create">
                            <button className="mt-4 px-6 py-3 bg-pink-600 text-white rounded-xl font-bold">
                                Add Products
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {allProducts.map((product) => (
                            <div key={product.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <MdInventory className="text-slate-400" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{product.name}</h3>
                                        <p className="text-pink-600 font-black">₹{product.price.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            <div className="flex gap-2 mt-4">
                                <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">
                                    <MdVisibility size={14} className="inline mr-1" />
                                        View
                                    </button>
                                    <button className="py-2 px-4 bg-pink-600 text-white rounded-xl text-sm font-bold">
                                        <MdShare size={14} className="inline mr-1" />
                                        Share
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
