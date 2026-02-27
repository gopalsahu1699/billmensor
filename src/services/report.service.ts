import { supabase } from "@/lib/supabase"

interface BalanceSheetData {
    assets: {
        current: { name: string; amount: number }[]
        fixed: { name: string; amount: number }[]
    }
    liabilities: {
        current: { name: string; amount: number }[]
        longTerm: { name: string; amount: number }[]
    }
    equity: { name: string; amount: number }[]
}

interface ProfitLossData {
    income: { name: string; amount: number }[]
    expenses: { name: string; amount: number }[]
    grossProfit: number
    netProfit: number
}

export const reportService = {
    async getBalanceSheet(startDate?: string, endDate?: string): Promise<BalanceSheetData> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id

        // Get receivables (unpaid invoices)
        const { data: invoices } = await supabase
            .from("invoices")
            .select("total_amount, balance_amount")
            .eq("user_id", userId)
            .neq("status", "cancelled")
            .neq("status", "void")

        // Get payables (unpaid purchases)
        const { data: purchases } = await supabase
            .from("purchases")
            .select("total_amount, balance_amount")
            .eq("user_id", userId)
            .neq("status", "cancelled")

        // Get expenses
        const { data: expenses } = await supabase
            .from("expenses")
            .select("amount, category")
            .eq("user_id", userId)

        // Calculate totals
        const receivables = invoices?.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0) || 0
        const payables = purchases?.reduce((sum, pur) => sum + (pur.balance_amount || 0), 0) || 0
        const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0

        // Get total income from paid invoices
        const { data: paidInvoices } = await supabase
            .from("invoices")
            .select("total_amount")
            .eq("user_id", userId)
            .eq("status", "paid")

        const totalIncome = paidInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
        const netProfit = totalIncome - totalExpenses

        return {
            assets: {
                current: [
                    { name: "Accounts Receivable", amount: receivables },
                    { name: "Cash & Bank", amount: 0 },
                    { name: "Inventory", amount: 0 }
                ],
                fixed: []
            },
            liabilities: {
                current: [
                    { name: "Accounts Payable", amount: payables }
                ],
                longTerm: []
            },
            equity: [
                { name: "Owner's Capital", amount: 0 },
                { name: "Retained Earnings", amount: netProfit }
            ]
        }
    },

    async getProfitLoss(startDate?: string, endDate?: string): Promise<ProfitLossData> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id

        // Get sales (paid invoices)
        const { data: invoices } = await supabase
            .from("invoices")
            .select("total_amount, subtotal")
            .eq("user_id", userId)
            .eq("status", "paid")

        // Get purchases
        const { data: purchases } = await supabase
            .from("purchases")
            .select("total_amount, subtotal")
            .eq("user_id", userId)
            .eq("status", "paid")

        // Get expenses
        const { data: expenses } = await supabase
            .from("expenses")
            .select("amount, category")
            .eq("user_id", userId)

        const totalSales = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
        const totalPurchases = purchases?.reduce((sum, pur) => sum + pur.total_amount, 0) || 0
        const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0

        const grossProfit = totalSales - totalPurchases
        const netProfit = grossProfit - totalExpenses

        return {
            income: [
                { name: "Sales", amount: totalSales }
            ],
            expenses: [
                { name: "Purchases", amount: totalPurchases },
                ...(expenses?.map(e => ({ name: e.category || "Other", amount: e.amount })) || [])
            ],
            grossProfit,
            netProfit
        }
    },

    async getGSTR2(month: number, year: number): Promise<any> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]

        // Get purchase invoices for the period
        const { data: purchases } = await supabase
            .from("purchases")
            .select(`
                *,
                suppliers (name, gstin),
                purchase_items (*)
            `)
            .eq("user_id", userId)
            .gte("purchase_date", startDate)
            .lte("purchase_date", endDate)
            .neq("status", "cancelled")

        return {
            period: `${month}/${year}`,
            invoices: purchases || [],
            summary: {
                totalTaxableValue: purchases?.reduce((sum, p) => sum + (p.subtotal || 0), 0) || 0,
                totalCGST: purchases?.reduce((sum, p) => sum + (p.cgst_total || 0), 0) || 0,
                totalSGST: purchases?.reduce((sum, p) => sum + (p.sgst_total || 0), 0) || 0,
                totalIGST: purchases?.reduce((sum, p) => sum + (p.igst_total || 0), 0) || 0,
                totalTax: purchases?.reduce((sum, p) => sum + (p.tax_total || 0), 0) || 0,
                totalAmount: purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
            }
        }
    },

    async getGSTR4(quarter: number, year: number): Promise<any> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id

        const startMonth = (quarter - 1) * 3 + 1
        const endMonth = quarter * 3

        const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`
        const endDate = new Date(year, endMonth, 0).toISOString().split('T')[0]

        // Get all invoices and purchases for the quarter
        const [invoices, purchases] = await Promise.all([
            supabase.from("invoices").select("*").eq("user_id", userId).gte("invoice_date", startDate).lte("invoice_date", endDate).neq("status", "cancelled"),
            supabase.from("purchases").select("*").eq("user_id", userId).gte("purchase_date", startDate).lte("purchase_date", endDate).neq("status", "cancelled")
        ])

        return {
            period: `Q${quarter}/${year}`,
            invoices: invoices.data || [],
            purchases: purchases.data || [],
            summary: {
                totalSales: invoices.data?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
                totalPurchases: purchases.data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
            }
        }
    },

    async getGSTR9(year: number): Promise<any> {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) throw new Error("Unauthorized")

        const userId = session.session.user.id

        const startDate = `${year}-04-01`
        const endDate = `${year + 1}-03-31`

        // Get all invoices and purchases for the financial year
        const [invoices, purchases, expenses] = await Promise.all([
            supabase.from("invoices").select("*").eq("user_id", userId).gte("invoice_date", startDate).lte("invoice_date", endDate).neq("status", "cancelled"),
            supabase.from("purchases").select("*").eq("user_id", userId).gte("purchase_date", startDate).lte("purchase_date", endDate).neq("status", "cancelled"),
            supabase.from("expenses").select("*").eq("user_id", userId).gte("expense_date", startDate).lte("expense_date", endDate)
        ])

        const totalSales = invoices.data?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
        const totalPurchases = purchases.data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
        const totalExpenses = expenses.data?.reduce((sum, e) => sum + e.amount, 0) || 0

        return {
            financialYear: `${year}-${year + 1}`,
            invoices: invoices.data || [],
            purchases: purchases.data || [],
            expenses: expenses.data || [],
            summary: {
                totalSales,
                totalPurchases,
                totalExpenses,
                totalTaxCollected: invoices.data?.reduce((sum, i) => sum + (i.tax_total || 0), 0) || 0,
                totalTaxPaid: purchases.data?.reduce((sum, p) => sum + (p.tax_total || 0), 0) || 0,
                netTaxLiability: (invoices.data?.reduce((sum, i) => sum + (i.tax_total || 0), 0) || 0) - (purchases.data?.reduce((sum, p) => sum + (p.tax_total || 0), 0) || 0)
            }
        }
    }
}
