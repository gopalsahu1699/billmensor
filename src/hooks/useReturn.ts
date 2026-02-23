import { useState, useEffect, useCallback } from "react"
import { returnService } from "@/services/return.service"
import { Return } from "@/types"

export function useReturns() {
    const [returns, setReturns] = useState<Return[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await returnService.list()
            setReturns(data)
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
        fetchReturns()
    }, [fetchReturns])

    return { returns, loading, error, refetch: fetchReturns }
}

export function useReturn(id?: string | null) {
    const [returnRec, setReturnRec] = useState<Return | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchReturn = useCallback(async () => {
        if (!id) return

        try {
            setLoading(true)
            setError(null)
            const data = await returnService.getById(id)
            setReturnRec(data)
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
        fetchReturn()
    }, [fetchReturn])

    return {
        returnRec,
        loading,
        error,
        refetch: fetchReturn
    }
}
