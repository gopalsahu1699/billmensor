import { supabase } from "@/lib/supabase"
import { Quotation } from "@/types"

export const quotationService = {
    /**
     * Fetch all quotations
     */
    async list(): Promise<Quotation[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("quotations")
            .select(`
        *,
        customers (*)
      `)
            .order("created_at", { ascending: false })

        if (error) {
            throw new Error(error.message)
        }

        return data as Quotation[]
    },

    /**
     * Fetch a single quotation by ID
     */
    async getById(id: string): Promise<Quotation> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("quotations")
            .select(`
        *,
        customers (*),
        items:quotation_items (*)
      `)
            .eq("id", id)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Quotation
    },

    /**
     * Create a new quotation
     */
    async create(quotationDataArg: Omit<Quotation, "id" | "created_at" | "party" | "customers">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...quotationData } = quotationDataArg

        const { data: newQuotation, error: quotationError } = await supabase
            .from("quotations")
            .insert([
                {
                    ...quotationData,
                    user_id: session.session.user.id,
                },
            ])
            .select()
            .single()

        if (quotationError) {
            throw new Error(quotationError.message)
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                quotation_id: newQuotation.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("quotation_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return newQuotation
    },

    /**
     * Update an existing quotation
     */
    async update(id: string, quotationDataArg: Partial<Omit<Quotation, "id" | "created_at" | "party" | "customers">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...quotationData } = quotationDataArg

        const { data: updatedQuotation, error: quotationError } = await supabase
            .from("quotations")
            .update({
                ...quotationData,
            })
            .eq("id", id)
            .select()
            .single()

        if (quotationError) {
            throw new Error(quotationError.message)
        }

        if (items) {
            // Handle item updates/replacements
            await supabase.from("quotation_items").delete().eq("quotation_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                quotation_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("quotation_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return updatedQuotation
    }
}
