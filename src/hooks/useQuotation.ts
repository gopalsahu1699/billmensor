import { useState, useEffect, useCallback } from "react"
import { quotationService } from "@/services/quotation.service"
import { Quotation } from "@/types"

export function useQuotations() {
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchQuotations = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await quotationService.list()
            setQuotations(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unknown error occurred")
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchQuotations()
    }, [fetchQuotations])

    return { quotations, loading, error, refetch: fetchQuotations }
}

export function useQuotation(id?: string | null) {
    const [quotation, setQuotation] = useState<Quotation | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchQuotation = useCallback(async () => {
        if (!id) return

        try {
            setLoading(true)
            setError(null)
            const data = await quotationService.getById(id)
            setQuotation(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unknown error occurred")
            }
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchQuotation()
    }, [fetchQuotation])

    return {
        quotation,
        loading,
        error,
        refetch: fetchQuotation
    }
}
