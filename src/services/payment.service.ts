import { supabase } from "@/lib/supabase"
import { Payment } from "@/types"

export const paymentService = {
    async list(type?: "payment_in" | "payment_out") {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        let query = supabase
            .from("payments")
            .select("*, customers(*), invoices(*)")
            .eq("user_id", session.session.user.id)
            .order("created_at", { ascending: false })

        if (type) {
            query = query.eq("type", type)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)
        return data as Payment[]
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*, customers(*), invoices(*)")
            .eq("id", id)
            .single()

        if (error) throw new Error(error.message)
        return data as Payment
    },

    async create(paymentData: Partial<Payment>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // Insert payload
        const { data, error } = await supabase
            .from("payments")
            .insert([
                {
                    ...paymentData,
                    user_id: session.session.user.id
                }
            ])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Payment
    },

    async update(id: string, paymentData: Partial<Payment>) {
        // Only allow updating non row-critical fields usually, but here we update entirely
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("payments")
            .update({
                ...paymentData,
                user_id: session.session.user.id,
            })
            .eq("id", id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Payment
    },

    /**
     * Recalculate the linked invoice's received/balance/status from all of its
     * payment_in records so the invoice and payments ledger stay in sync.
     */
    async reconcileInvoice(invoiceId?: string | null) {
        if (!invoiceId) return

        const { data: pays } = await supabase
            .from("payments")
            .select("amount")
            .eq("invoice_id", invoiceId)
            .eq("type", "payment_in")

        const { data: inv } = await supabase
            .from("invoices")
            .select("total_amount, payment_status")
            .eq("id", invoiceId)
            .single()

        if (!inv) return

        const totalPaid = (pays || []).reduce((sum, p) => sum + (p.amount || 0), 0)
        const paid = Number(Math.min(inv.total_amount || 0, totalPaid).toFixed(2))
        const balance = Number(Math.max(0, (inv.total_amount || 0) - paid).toFixed(2))
        const newStatus = inv.payment_status === 'hide'
            ? 'hide'
            : balance <= 0
                ? 'paid'
                : paid > 0
                    ? 'partially_paid'
                    : 'unpaid'

        await supabase
            .from("invoices")
            .update({ amount_paid: paid, balance_amount: balance, payment_status: newStatus })
            .eq("id", invoiceId)
    }
}
