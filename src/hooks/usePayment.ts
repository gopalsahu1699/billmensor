import { useEffect, useState, useCallback } from "react"
import { Payment } from "@/types/index"
import { paymentService } from "@/services/payment.service"

export function usePayment(id?: string | null) {
    const [payment, setPayment] = useState<Payment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const data = await paymentService.getById(id)
                setPayment(data)
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
        payment,
        loading,
        error,
        refetch: async () => {
            if (id) {
                try {
                    const data = await paymentService.getById(id)
                    setPayment(data)
                } catch (err) {
                    console.error("Refetch failed", err)
                }
            }
        }
    }
}

export function usePayments(type?: "payment_in" | "payment_out") {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await paymentService.list(type)
            setPayments(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unknown error occurred")
            }
        } finally {
            setLoading(false)
        }
    }, [type])

    useEffect(() => {
        fetchPayments()
    }, [fetchPayments])

    return { payments, loading, error, refetch: fetchPayments }
}
