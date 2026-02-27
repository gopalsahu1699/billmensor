import { useEffect, useState } from "react"
import { alertService } from "@/services/alert.service"
import { LowStockAlert } from "@/types/index"

export function useLowStockAlerts() {
    const [alerts, setAlerts] = useState<LowStockAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            const data = await alertService.getLowStock()
            setAlerts(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAlerts()
    }, [])

    return {
        alerts,
        loading,
        error,
        refetch: fetchAlerts,
        unreadCount: alerts.length
    }
}
