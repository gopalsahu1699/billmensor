import { supabase } from "@/lib/supabase"
import { Return } from "@/types"

export const returnService = {
    /**
     * Fetch all returns
     */
    async list(): Promise<Return[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("returns")
            .select(`
        *,
        party:customers (*)
      `)
            .order("created_at", { ascending: false })
        // .eq("user_id", session.session.user.id) // Assuming multi-tenant

        if (error) {
            throw new Error(error.message)
        }

        return data as Return[]
    },

    /**
     * Fetch a single return by ID
     */
    async getById(id: string): Promise<Return> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("returns")
            .select(`
        *,
        party:customers (*),
        items:return_items (*)
      `)
            .eq("id", id)
            // .eq("user_id", session.session.user.id)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Return
    },

    /**
     * Create a new return
     */
    async create(returnDataArg: Omit<Return, "id" | "created_at" | "party">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...returnData } = returnDataArg

        const { data: newReturn, error: returnError } = await supabase
            .from("returns")
            .insert([
                {
                    ...returnData,
                    user_id: session.session.user.id,
                },
            ])
            .select()
            .single()

        if (returnError) {
            throw new Error(returnError.message)
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                return_id: newReturn.id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("return_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return newReturn
    },

    /**
     * Update an existing return
     */
    async update(id: string, returnDataArg: Partial<Omit<Return, "id" | "created_at" | "party">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { items, ...returnData } = returnDataArg

        const { data: updatedReturn, error: returnError } = await supabase
            .from("returns")
            .update({
                ...returnData,
            })
            .eq("id", id)
            .select()
            .single()

        if (returnError) {
            throw new Error(returnError.message)
        }

        if (items) {
            // Handle item updates/replacements
            await supabase.from("return_items").delete().eq("return_id", id)

            const itemsToInsert = items.map(item => ({
                ...item,
                return_id: id,
                user_id: session.session.user.id
            }))

            const { error: itemsError } = await supabase
                .from("return_items")
                .insert(itemsToInsert)

            if (itemsError) {
                throw new Error(itemsError.message)
            }
        }

        return updatedReturn
    }
}
