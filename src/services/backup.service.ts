import { supabase } from "@/lib/supabase"
import { Backup } from "@/types/index"

export const backupService = {
    async list(): Promise<Backup[]> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data, error } = await supabase
            .from("backups")
            .select("*")
            .eq("user_id", session.session.user.id)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as Backup[]
    },

    async create(backupType: 'auto' | 'manual' = 'manual'): Promise<Backup> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `backup-${timestamp}.json`

        // Create a record first with pending status
        const { data: backupRecord, error: recordError } = await supabase
            .from("backups")
            .insert({
                user_id: userId,
                backup_type: backupType,
                file_name: fileName,
                status: 'pending'
            })
            .select()
            .single()

        if (recordError) throw new Error(recordError.message)

        try {
            // Fetch all user data
            const [invoices, customers, products, purchases, quotations] = await Promise.all([
                supabase.from('invoices').select('*').eq('user_id', userId),
                supabase.from('customers').select('*').eq('user_id', userId),
                supabase.from('products').select('*').eq('user_id', userId),
                supabase.from('purchases').select('*').eq('user_id', userId),
                supabase.from('quotations').select('*').eq('user_id', userId)
            ])

            const backupData = {
                version: '2.0',
                created_at: new Date().toISOString(),
                user_id: userId,
                data: {
                    invoices: invoices.data,
                    customers: customers.data,
                    products: products.data,
                    purchases: purchases.data,
                    quotations: quotations.data
                }
            }

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('backups')
                .upload(`${userId}/${fileName}`, JSON.stringify(backupData, null, 2))

            if (uploadError) throw new Error(uploadError.message)

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('backups')
                .getPublicUrl(`${userId}/${fileName}`)

            // Update record with success
            const { data: updatedBackup, error: updateError } = await supabase
                .from('backups')
                .update({
                    status: 'completed',
                    file_url: urlData.publicUrl
                })
                .eq('id', backupRecord.id)
                .select()
                .single()

            if (updateError) throw new Error(updateError.message)
            return updatedBackup as Backup

        } catch (error) {
            // Mark as failed
            await supabase
                .from('backups')
                .update({ status: 'failed', notes: String(error) })
                .eq('id', backupRecord.id)

            throw error
        }
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("backups")
            .delete()
            .eq("id", id)

        if (error) throw new Error(error.message)
    },

    async restore(backupId: string) {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const { data: backup, error: fetchError } = await supabase
            .from("backups")
            .select("file_url, data")
            .eq("id", backupId)
            .single()

        if (fetchError) throw new Error(fetchError.message)
        if (!backup?.file_url) throw new Error("Backup file not found")

        // Download the backup file
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('backups')
            .download(backup.file_url)

        if (downloadError) throw new Error(downloadError.message)

        const text = await fileData.text()
        const backupContent = JSON.parse(text)

        // Restore data (simplified - in production, you'd want more careful merging)
        const userId = session.session.user.id

        if (backupContent.data.customers) {
            for (const customer of backupContent.data.customers) {
                const { id, ...customerData } = customer
                await supabase.from('customers').upsert({
                    ...customerData,
                    user_id: userId
                }, { onConflict: 'id' })
            }
        }

        if (backupContent.data.products) {
            for (const product of backupContent.data.products) {
                const { id, ...productData } = product
                await supabase.from('products').upsert({
                    ...productData,
                    user_id: userId
                }, { onConflict: 'id' })
            }
        }

        return { success: true }
    }
}
