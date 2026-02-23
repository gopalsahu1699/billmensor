import { supabase } from "@/lib/supabase"
import { Purchase } from "@/types/index"

export const purchaseService = {
    async getById(id: string): Promise<Purchase> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("purchases")
            .select(`
        *,
        suppliers:customers!supplier_id (*),
        items:purchase_items (*)
      `)
            .eq("id", id)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Purchase
    },

    async list(): Promise<Purchase[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("purchases")
            .select(`
        *,
        suppliers:customers!supplier_id (*),
        items:purchase_items (*)
      `)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(error.message)
        }

        return data as Purchase[]
    },

    async create(purchase: Omit<Purchase, "id" | "created_at" | "party">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...purchaseData } = purchase

        const { data: newPurchase, error: purchaseError } = await supabase
            .from("purchases")
            .insert({
                ...purchaseData,
                user_id: session.session.user.id
            })
            .select()
            .single()

        if (purchaseError) {
            throw new Error(purchaseError.message)
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                purchase_id: newPurchase.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("purchase_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return newPurchase
    },

    /**
     * Update an existing purchase
     */
    async update(id: string, purchase: Partial<Omit<Purchase, "id" | "created_at" | "party" | "suppliers">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...purchaseData } = purchase

        const { data: updatedPurchase, error: purchaseError } = await supabase
            .from("purchases")
            .update({
                ...purchaseData,
            })
            .eq("id", id)
            .select()
            .single()

        if (purchaseError) {
            throw new Error(purchaseError.message)
        }

        if (items) {
            // Handle item updates/replacements
            await supabase.from("purchase_items").delete().eq("purchase_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                purchase_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("purchase_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return updatedPurchase
    }
}
