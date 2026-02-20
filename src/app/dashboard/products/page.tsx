'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteProduct(id: string) {
        if (!confirm('Are you sure you want to permanently delete this product?')) return

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Product deleted successfully')
            fetchProducts()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredProducts = products.filter(p =>
        (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (p.sku?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const totalValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock_quantity || 0), 0)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Product Catalog</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your inventory, pricing and stock levels.</p>
                </div>
                <Link href="/dashboard/products/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Add Product
                    </button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Products</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{products.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory Value</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">₹{totalValue.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
                            <span className="material-symbols-outlined">production_quantity_limits</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Low Stock</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{products.filter(p => (p.stock_quantity || 0) < 10).length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / HSN</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">inventory</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{product.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{product.sku || '-'}</p>
                                        {product.hsn_code && (
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">HSN: {product.hsn_code}</p>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-slate-100">
                                        ₹{(product.price || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-sm font-bold ${(product.stock_quantity || 0) < 10 ? 'text-red-600' : 'text-green-700'}`}>
                                            {product.stock_quantity || 0}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-1">{product.unit || 'pcs'}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/products/create?edit=${product.id}`);
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProduct(product.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight italic">No Products Found</p>
                                                <p className="text-slate-500 text-xs mt-1">Add your first product to the catalog.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
