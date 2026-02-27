import { supabase } from "@/lib/supabase"
import { BankAccount } from "@/types/index"

export const bankAccountService = {
    async list(): Promise<BankAccount[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("bank_accounts")
            .select("*")
            .eq("user_id", session.session.user.id)
            .eq("is_active", true)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as BankAccount[]
    },

    async getById(id: string): Promise<BankAccount> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("bank_accounts")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw new Error(error.message)
        return data as BankAccount
    },

    async getPrimary(): Promise<BankAccount | null> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("bank_accounts")
            .select("*")
            .eq("user_id", session.session.user.id)
            .eq("is_primary", true)
            .eq("is_active", true)
            .single()

        if (error || !data) return null
        return data as BankAccount
    },

    async create(account: Omit<BankAccount, "id" | "created_at">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // If setting as primary, unset other primaries
        if (account.is_primary) {
            await supabase
                .from("bank_accounts")
                .update({ is_primary: false })
                .eq("user_id", session.session.user.id)
        }

        const { data, error } = await supabase
            .from("bank_accounts")
            .insert({
                ...account,
                user_id: session.session.user.id
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as BankAccount
    },

    async update(id: string, account: Partial<Omit<BankAccount, "id" | "created_at" | "user_id">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        // If setting as primary, unset other primaries
        if (account.is_primary) {
            await supabase
                .from("bank_accounts")
                .update({ is_primary: false })
                .eq("user_id", session.session.user.id)
                .neq("id", id)
        }

        const { data, error } = await supabase
            .from("bank_accounts")
            .update(account)
            .eq("id", id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as BankAccount
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("bank_accounts")
            .update({ is_active: false })
            .eq("id", id)

        if (error) throw new Error(error.message)
    }
}
