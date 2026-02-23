import { useEffect, useState } from "react"
import { Invoice } from "@/types/index"
import { invoiceService } from "@/services/invoice.service"

export function useInvoice(id?: string | null) {
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const data = await invoiceService.getById(id)
                setInvoice(data)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError("An unknown error occurred")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    return {
        invoice,
        loading,
        error,
        refetch: async () => {
            if (id) {
                try {
                    const data = await invoiceService.getById(id)
                    setInvoice(data)
                } catch (err) {
                    console.error("Refetch failed", err)
                }
            }
        }
    }
}

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInvoices = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await invoiceService.list()
            setInvoices(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unknown error occurred")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    return { invoices, loading, error, refetch: fetchInvoices }
}
