import { supabase } from "@/lib/supabase"
import { TeamMember } from "@/types/index"

export const teamService = {
    async list(): Promise<TeamMember[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("team_members")
            .select("*")
            .eq("owner_id", session.session.user.id)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as TeamMember[]
    },

    async getById(id: string): Promise<TeamMember> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("team_members")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw new Error(error.message)
        return data as TeamMember
    },

    async invite(member: Omit<TeamMember, "id" | "created_at" | "status" | "invited_at">) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("team_members")
            .insert({
                ...member,
                owner_id: session.session.user.id,
                status: 'invited'
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as TeamMember
    },

    async update(id: string, member: Partial<Omit<TeamMember, "id" | "created_at" | "owner_id">>) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("team_members")
            .update(member)
            .eq("id", id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as TeamMember
    },

    async remove(id: string) {
        const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("id", id)

        if (error) throw new Error(error.message)
    },

    async getMyRole(): Promise<{ role: string; permissions: TeamMember['permissions'] } | null> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) return null

        const { data, error } = await supabase
            .from("team_members")
            .select("role, permissions")
            .eq("user_id", session.session.user.id)
            .eq("status", "active")
            .single()

        if (error || !data) return null
        return data
    }
}
