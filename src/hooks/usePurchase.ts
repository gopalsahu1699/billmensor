import { useEffect, useState } from "react"
import { Purchase } from "@/types/index"
import { purchaseService } from "@/services/purchase.service"

export function usePurchase(id?: string | null) {
    const [purchase, setPurchase] = useState<Purchase | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const data = await purchaseService.getById(id)
                setPurchase(data)
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
        purchase,
        loading,
        error,
        refetch: async () => {
            if (id) {
                try {
                    const data = await purchaseService.getById(id)
                    setPurchase(data)
                } catch (err) {
                    console.error("Refetch failed", err)
                }
            }
        }
    }
}

export function usePurchases() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPurchases = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await purchaseService.list()
            setPurchases(data)
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
        fetchPurchases()
    }, [])

    return { purchases, loading, error, refetch: fetchPurchases }
}
