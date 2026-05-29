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

    async getMyRole(): Promise<{ role: string; permissions?: TeamMember['permissions'] } | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const userId = user.id

            // 1. Try WEXO Hierarchy first (staff_members)
            try {
                const { data: staff, error: staffError } = await supabase
                    .from("staff_members")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("status", "active")
                    .limit(1)

                if (!staffError && staff && staff.length > 0) {
                    return {
                        role: staff[0].hierarchy_role || staff[0].role || 'staff',
                        permissions: {
                            invoices: true,
                            quotations: true,
                            products: true,
                            customers: true,
                            reports: true
                        }
                    }
                }
            } catch (e) {
                // staff_members table may not exist
            }

            // 2. Fallback to BillMensor Legacy (team_members)
            try {
                const { data: team, error: teamError } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("status", "active")
                    .limit(1)

                if (!teamError && team && team.length > 0) {
                    return {
                        role: team[0].role || 'staff',
                        permissions: team[0].permissions
                    }
                }
            } catch (e) {
                // team_members table may not exist
            }

            // Default: if we are authenticated but not in any team table, 
            // we are likely the owner (who has auth.uid() but no team_member entry)
            return { role: 'owner' }
        } catch (err) {
            console.error('Error fetching role:', err)
            return { role: 'owner' } // Safe fallback
        }
    }
}
