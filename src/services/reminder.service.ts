import { supabase } from "@/lib/supabase"
import { PaymentReminder } from "@/types/index"

export const reminderService = {
    async list(): Promise<PaymentReminder[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("payment_reminders")
            .select(`*, invoices (*)`)
            .eq("user_id", session.session.user.id)
            .order('reminder_date', { ascending: true })

        if (error) throw new Error(error.message)
        return data as PaymentReminder[]
    },

    async getPending(): Promise<PaymentReminder[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from("payment_reminders")
            .select(`*, invoices (*)`)
            .eq("user_id", session.session.user.id)
            .eq("status", "pending")
            .lte("reminder_date", today)
            .order('reminder_date', { ascending: true })

        if (error) throw new Error(error.message)
        return data as PaymentReminder[]
    },

    async create(reminder: Omit<PaymentReminder, "id" | "created_at" | "status" | "sent_date">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("payment_reminders")
            .insert({
                ...reminder,
                user_id: session.session.user.id,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as PaymentReminder
    },

    async send(id: string, sentVia: 'whatsapp' | 'sms' | 'email', message: string) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("payment_reminders")
            .update({
                status: 'sent',
                sent_date: new Date().toISOString(),
                sent_via: sentVia,
                message: message
            })
            .eq("id", id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as PaymentReminder
    },

    async markFailed(id: string) {
        const { error } = await supabase
            .from("payment_reminders")
            .update({ status: 'failed' })
            .eq("id", id)

        if (error) throw new Error(error.message)
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("payment_reminders")
            .delete()
            .eq("id", id)

        if (error) throw new Error(error.message)
    },

    async scheduleAutoReminders(invoiceId: string, daysAfterDue: number = 3) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // Get invoice to calculate reminder date
        const { data: invoice } = await supabase
            .from("invoices")
            .select("due_date")
            .eq("id", invoiceId)
            .single()

        if (!invoice?.due_date) return

        const dueDate = new Date(invoice.due_date)
        dueDate.setDate(dueDate.getDate() + daysAfterDue)

        const { error } = await supabase
            .from("payment_reminders")
            .insert({
                user_id: session.session.user.id,
                invoice_id: invoiceId,
                reminder_date: dueDate.toISOString().split('T')[0]
            })

        if (error) throw new Error(error.message)
    }
}
