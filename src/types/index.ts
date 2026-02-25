export interface Party {
    id: string
    name: string
    phone?: string
    email?: string
    gst_number?: string // Keep for legacy
    gstin?: string
    address?: string
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    business_type?: string
    industry_type?: string
    category?: string
}

export interface Customer extends Party {
    created_at: string;
}

export interface Product {
    id: string
    name: string
    sku?: string
    hsn_code?: string
    description?: string
    price: number
    purchase_price: number
    stock_quantity: number
    min_stock_level?: number
    unit?: string
    tax_rate?: number
    category?: string
    image_url?: string
    opening_stock_value?: number
    created_at: string
}

export interface InvoiceItem {
    id: string
    product_id?: string
    name: string
    hsn_code?: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    discount?: number
    total: number
    image_url?: string
}

export interface Invoice {
    id: string
    user_id?: string
    customer_id?: string
    customers?: Customer
    invoice_number: string
    invoice_date: string
    due_date?: string
    items: InvoiceItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    discount?: number
    round_off?: number
    transport_charges?: number
    installation_charges?: number
    custom_charges?: { name: string, amount: number }[]
    gst_amount?: number
    total_amount: number
    amount_paid?: number
    balance_amount?: number
    is_pos?: boolean
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    notes?: string
    payment_status?: string
    status: "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled" | "void"
    created_at: string
}

export interface QuotationItem {
    id: string
    product_id?: string
    name: string
    hsn_code?: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    discount?: number
    total: number
    image_url?: string
}

export interface Quotation {
    id: string
    user_id?: string
    customer_id?: string
    customers?: Customer
    quotation_number: string
    quotation_date: string
    expiry_date?: string | null
    items: QuotationItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    transport_charges?: number
    installation_charges?: number
    custom_charges?: { name: string, amount: number }[]
    total_amount: number
    status: "pending" | "accepted" | "rejected" | "invoiced" | "draft"
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    notes?: string | null
    created_at: string
}

export interface PurchaseItem {
    id: string
    product_id?: string
    name: string
    hsn_code?: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    discount?: number
    total: number
}

export interface Purchase {
    id: string
    user_id?: string
    supplier_id?: string
    suppliers?: Customer
    purchase_number: string
    purchase_date: string
    items: PurchaseItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    total_amount: number
    payment_status?: string
    status: "draft" | "partial" | "paid" | "cancelled" | "overdue"
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    notes?: string
    created_at: string
}

export interface ReturnItem {
    id: string
    product_id?: string
    name: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    total: number
}

export interface Return {
    id: string
    user_id?: string
    customer_id?: string
    customers?: Customer
    return_number: string
    return_date: string
    type: "sales_return" | "purchase_return"
    items: ReturnItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    total_amount: number
    status: "draft" | "approved" | "rejected" | "completed" | "partial" | "paid"
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    notes?: string | null
    created_at: string
}

export interface DeliveryChallanItem {
    id: string
    product_id?: string
    name: string
    hsn_code?: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    total: number
}

export interface DeliveryChallan {
    id: string
    user_id?: string
    customer_id?: string
    customers?: Customer
    challan_number: string
    challan_date: string
    items: DeliveryChallanItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    total_amount: number
    status: "draft" | "delivered" | "in_transit"
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    notes?: string
    created_at: string
}

export interface PaymentItem {
    id: string
    amount: number
    invoice_id?: string
    purchase_id?: string
}

export interface Payment {
    id: string
    user_id?: string
    customer_id?: string | null
    customers?: Customer
    invoice_id?: string | null
    purchase_id?: string | null
    payment_number: string
    payment_date: string
    type: "payment_in" | "payment_out"
    amount: number
    payment_mode: string
    reference_number?: string | null
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    notes?: string | null
    items?: PaymentItem[]
    invoices?: { invoice_number: string }
    purchases?: { purchase_number: string }
    created_at: string
}

export interface Expense {
    id: string
    user_id: string
    title: string
    category?: string
    amount: number
    expense_date: string
    description?: string
    created_at?: string
}

export interface Profile {
    id: string;
    company_name: string;
    full_name?: string;
    designation?: string;
    email: string;
    phone?: string;
    gstin?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    business_type?: string;
    industry_type?: string;
    place_of_supply?: string;
    website?: string;
    terms_and_conditions?: string;
    logo_url?: string;
    signature_url?: string;
    custom_field_1_label?: string;
    custom_field_1_value?: string;
    custom_field_2_label?: string;
    custom_field_2_value?: string;
    custom_field_3_label?: string;
    custom_field_3_value?: string;
    brand_color?: string;
    accent_color?: string;
    font_family?: string;
    plan_type?: 'free' | 'monthly' | 'yearly';
    plan_status?: 'active' | 'expired' | 'canceled';
    plan_expiry?: string;
    last_payment_id?: string;
    created_at: string;
}

export interface BankDetails {
    id?: string;
    user_id: string;
    account_number?: string;
    account_holder_name?: string;
    ifsc_code?: string;
    bank_branch_name?: string;
    upi_id?: string;
    created_at?: string;
}
