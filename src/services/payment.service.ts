import { supabase } from "@/lib/supabase"
import { Payment } from "@/types"

export const paymentService = {
    async list(type?: "payment_in" | "payment_out") {
        let query = supabase
            .from("payments")
            .select("*, customers(*)")
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
            .select("*, customers(*)")
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
            .update(paymentData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Payment
    }
}
