import { useState, useCallback, useEffect } from "react"
import { paymentService } from "@/services/payment.service"
import { Payment } from "@/types"

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

export function usePayment(id: string | null) {
    const [payment, setPayment] = useState<Payment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPayment = useCallback(async () => {
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
    }, [id])

    useEffect(() => {
        if (id) {
            fetchPayment()
        } else {
            setLoading(false)
        }
    }, [id, fetchPayment])

    return { payment, loading, error, refetch: fetchPayment }
}
