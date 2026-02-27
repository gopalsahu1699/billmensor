import { supabase } from "@/lib/supabase"
import { LowStockAlert } from "@/types/index"

export const alertService = {
    async getLowStock(): Promise<LowStockAlert[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("low_stock_alerts")
            .select(`*, products (*)`)
            .eq("user_id", session.session.user.id)
            .eq("is_read", false)
            .order("created_at", { ascending: false })

        if (error) throw new Error(error.message)
        return data as LowStockAlert[]
    },

    async createAlert(productId: string): Promise<LowStockAlert> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // Get product details
        const { data: product } = await supabase
            .from("products")
            .select("stock_quantity, min_stock_level")
            .eq("id", productId)
            .single()

        if (!product) throw new Error("Product not found")

        // Check if alert already exists
        const { data: existing } = await supabase
            .from("low_stock_alerts")
            .select("id")
            .eq("user_id", session.session.user.id)
            .eq("product_id", productId)
            .eq("is_read", false)
            .single()

        if (existing) return existing as LowStockAlert

        const { data, error } = await supabase
            .from("low_stock_alerts")
            .insert({
                user_id: session.session.user.id,
                product_id: productId,
                current_stock: product.stock_quantity,
                min_stock_level: product.min_stock_level || 0
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as LowStockAlert
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from("low_stock_alerts")
            .update({ is_read: true })
            .eq("id", id)

        if (error) throw new Error(error.message)
    },

    async markAllAsRead() {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { error } = await supabase
            .from("low_stock_alerts")
            .update({ is_read: true })
            .eq("user_id", session.session.user.id)
            .eq("is_read", false)

        if (error) throw new Error(error.message)
    },

    async checkAndCreateAlerts() {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // Get products with low stock and alerts enabled
        const { data: products } = await supabase
            .from("products")
            .select("id, stock_quantity, min_stock_level, is_low_stock_alert")
            .eq("user_id", session.session.user.id)
            .eq("is_low_stock_alert", true)
            .lte("stock_quantity", supabase.rpc("COALESCE", { val: "min_stock_level", def: 0 }))

        if (!products || products.length === 0) return

        for (const product of products) {
            const minLevel = product.min_stock_level || 0
            if (product.stock_quantity <= minLevel) {
                await this.createAlert(product.id)
            }
        }
    }
}
