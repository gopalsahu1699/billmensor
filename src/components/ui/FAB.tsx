'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MdAdd, MdReceipt, MdPersonAdd, MdInventory, MdPayment } from 'react-icons/md'

interface FABAction {
    label: string
    href: string
    icon: React.ReactNode
    color: string
}

const actions: FABAction[] = [
    {
        label: 'Add Invoice',
        href: '/dashboard/invoices/create',
        icon: <MdReceipt size={20} />,
        color: 'bg-blue-600 hover:bg-blue-500'
    },
    {
        label: 'Add Customer',
        href: '/dashboard/customers/create',
        icon: <MdPersonAdd size={20} />,
        color: 'bg-green-600 hover:bg-green-500'
    },
    {
        label: 'Add Product',
        href: '/dashboard/products/create',
        icon: <MdInventory size={20} />,
        color: 'bg-purple-600 hover:bg-purple-500'
    },
    {
        label: 'Take Payment',
        href: '/dashboard/payments-in/create',
        icon: <MdPayment size={20} />,
        color: 'bg-amber-600 hover:bg-amber-500'
    }
]

export function FAB() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Action Items */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 space-y-3 mb-2">
                    {actions.map((action, index) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={`flex items-center gap-3 ${action.color} text-white pl-4 pr-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-2 duration-200`}
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setIsOpen(false)}
                        >
                            {action.icon}
                            <span className="text-sm font-bold whitespace-nowrap">{action.label}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center transition-all active:scale-90 ${isOpen ? 'rotate-45' : ''}`}
            >
                <MdAdd size={28} />
            </button>
        </div>
    )
}
