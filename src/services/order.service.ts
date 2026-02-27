import { supabase } from "@/lib/supabase"
import { SalesOrder, PurchaseOrder } from "@/types/index"

export const salesOrderService = {
    async getById(id: string): Promise<SalesOrder> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("sales_orders")
            .select(`*, customers (*), items:sales_order_items (*)`)
            .eq("id", id)
            .single()

        if (error) throw new Error(error.message)
        return data as SalesOrder
    },

    async list(): Promise<SalesOrder[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("sales_orders")
            .select(`*, customers (*), items:sales_order_items (*)`)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as SalesOrder[]
    },

    async create(order: Omit<SalesOrder, "id" | "created_at">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...orderData } = order

        const { data: newOrder, error: orderError } = await supabase
            .from("sales_orders")
            .insert({ ...orderData, user_id: session.session.user.id })
            .select()
            .single()

        if (orderError) throw new Error(orderError.message)

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                order_id: newOrder.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("sales_order_items")
                .insert(itemsToInsert)

            if (itemsError) throw new Error(itemsError.message)
        }

        return newOrder
    },

    async update(id: string, order: Partial<Omit<SalesOrder, "id" | "created_at">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...orderData } = order

        const { data: updatedOrder, error: orderError } = await supabase
            .from("sales_orders")
            .update(orderData)
            .eq("id", id)
            .select()
            .single()

        if (orderError) throw new Error(orderError.message)

        if (items) {
            await supabase.from("sales_order_items").delete().eq("order_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                order_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("sales_order_items")
                .insert(itemsToInsert)

            if (itemsError) throw new Error(itemsError.message)
        }

        return updatedOrder
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("sales_orders")
            .delete()
            .eq("id", id)

        if (error) throw new Error(error.message)
    }
}

export const purchaseOrderService = {
    async getById(id: string): Promise<PurchaseOrder> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("purchase_orders")
            .select(`*, suppliers (*), items:purchase_order_items (*)`)
            .eq("id", id)
            .single()

        if (error) throw new Error(error.message)
        return data as PurchaseOrder
    },

    async list(): Promise<PurchaseOrder[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("purchase_orders")
            .select(`*, suppliers (*), items:purchase_order_items (*)`)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as PurchaseOrder[]
    },

    async create(order: Omit<PurchaseOrder, "id" | "created_at">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...orderData } = order

        const { data: newOrder, error: orderError } = await supabase
            .from("purchase_orders")
            .insert({ ...orderData, user_id: session.session.user.id })
            .select()
            .single()

        if (orderError) throw new Error(orderError.message)

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                order_id: newOrder.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("purchase_order_items")
                .insert(itemsToInsert)

            if (itemsError) throw new Error(itemsError.message)
        }

        return newOrder
    },

    async update(id: string, order: Partial<Omit<PurchaseOrder, "id" | "created_at">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...orderData } = order

        const { data: updatedOrder, error: orderError } = await supabase
            .from("purchase_orders")
            .update(orderData)
            .eq("id", id)
            .select()
            .single()

        if (orderError) throw new Error(orderError.message)

        if (items) {
            await supabase.from("purchase_order_items").delete().eq("order_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                order_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("purchase_order_items")
                .insert(itemsToInsert)

            if (itemsError) throw new Error(itemsError.message)
        }

        return updatedOrder
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("purchase_orders")
            .delete()
            .eq("id", id)

        if (error) throw new Error(error.message)
    }
}
