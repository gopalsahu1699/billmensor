import { supabase } from "@/lib/supabase"
import { Invoice } from "@/types/index"

export const invoiceService = {
    /**
     * Fetch a single invoice by ID
     */
    async getById(id: string): Promise<Invoice> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("invoices")
            .select(`
        *,
        customers (*),
        items:invoice_items (*)
      `)
            .eq("id", id)
            // .eq("user_id", session.session.user.id) // Assuming multi-tenant
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Invoice
    },

    /**
     * Fetch all invoices (paginated or filtered)
     */
    async list(): Promise<Invoice[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("invoices")
            .select(`
        *,
        customers (*),
        items:invoice_items (*)
      `)
            // .eq("user_id", session.session.user.id)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(error.message)
        }

        return data as Invoice[]
    },

    /**
     * Create a new invoice
     */
    async create(invoice: Omit<Invoice, "id" | "created_at" | "party">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // Assuming we insert the invoice first, then the items
        const { items, ...invoiceData } = invoice

        const { data: newInvoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
                ...invoiceData,
                user_id: session.session.user.id
            })
            .select()
            .single()

        if (invoiceError) {
            throw new Error(invoiceError.message)
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                invoice_id: newInvoice.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("invoice_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return newInvoice
    },

    /**
     * Update an existing invoice
     */
    async update(id: string, invoice: Partial<Omit<Invoice, "id" | "created_at" | "party">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...invoiceData } = invoice

        const { data: updatedInvoice, error: invoiceError } = await supabase
            .from("invoices")
            .update({
                ...invoiceData,
                user_id: session.session.user.id
            })
            .eq("id", id)
            .select()
            .single()

        if (invoiceError) {
            throw new Error(invoiceError.message)
        }

        // Replace all items. If doing a true diff, it requires more logic.
        // Easiest is to delete existing and insert new (as was done in the original UI)
        if (items) {
            await supabase.from("invoice_items").delete().eq("invoice_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                invoice_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("invoice_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return updatedInvoice
    }
}
