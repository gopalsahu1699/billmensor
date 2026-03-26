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
    // New fields for upgrade
    barcode?: string
    batch_number?: string
    expiry_date?: string
    mfg_date?: string
    reorder_point?: number
    is_low_stock_alert?: boolean
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
    // New fields for upgrade
    einvoice_irn?: string
    einvoice_qr_code?: string
    einvoice_status?: "pending" | "generated" | "failed" | "canceled"
    einvoice_ack_no?: string
    einvoice_ack_date?: string
    qr_payment_upi_id?: string
    qr_payment_amount?: number
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
    billing_phone?: string | null
    shipping_phone?: string | null
    shipping_gstin?: string | null
    billing_gstin?: string | null
    supply_place?: string
    transport_charges?: number
    installation_charges?: number
    custom_charges?: { name: string, amount: number }[]
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

// ============================================================
// NEW TYPES FOR UPGRADE V2
// ============================================================

export interface TeamMember {
    id: string
    user_id: string
    owner_id: string
    email: string
    name?: string
    role: "admin" | "staff" | "viewer"
    permissions: {
        invoices?: boolean
        quotations?: boolean
        purchases?: boolean
        products?: boolean
        customers?: boolean
        reports?: boolean
        settings?: boolean
    }
    status: "active" | "invited" | "disabled"
    invited_at?: string
    created_at: string
}

export interface BankAccount {
    id: string
    user_id: string
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    account_holder_name?: string
    upi_id?: string
    is_primary: boolean
    is_active: boolean
    created_at: string
}

export interface EinvoiceSettings {
    id: string
    user_id: string
    gstin?: string
    username?: string
    password_encrypted?: string
    client_id?: string
    client_secret_encrypted?: string
    environment: "sandbox" | "production"
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface SalesOrderItem {
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

export interface SalesOrder {
    id: string
    user_id?: string
    customer_id?: string
    customers?: Customer
    order_number: string
    order_date: string
    expected_date?: string
    items: SalesOrderItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    total_amount: number
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
    notes?: string
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    created_at: string
}

export interface PurchaseOrderItem {
    id: string
    product_id?: string
    name: string
    hsn_code?: string
    quantity: number
    received_quantity?: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    total: number
}

export interface PurchaseOrder {
    id: string
    user_id?: string
    supplier_id?: string
    suppliers?: Customer
    order_number: string
    order_date: string
    expected_date?: string
    items: PurchaseOrderItem[]
    subtotal: number
    cgst_total: number
    sgst_total: number
    igst_total: number
    tax_total: number
    total_amount: number
    status: "pending" | "confirmed" | "received" | "partial" | "cancelled"
    notes?: string
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    created_at: string
}

export interface PaymentReminder {
    id: string
    user_id: string
    invoice_id: string
    invoices?: Invoice
    reminder_date?: string
    sent_date?: string
    sent_via?: "whatsapp" | "sms" | "email"
    status: "pending" | "sent" | "failed"
    message?: string
    created_at: string
}

export interface Backup {
    id: string
    user_id: string
    backup_type?: "auto" | "manual"
    file_name?: string
    file_url?: string
    file_size?: number
    status: "pending" | "completed" | "failed"
    notes?: string
    created_at: string
}

export interface LowStockAlert {
    id: string
    user_id: string
    product_id: string
    products?: Product
    current_stock?: number
    min_stock_level?: number
    is_read: boolean
    created_at: string
}

export interface Cheque {
    id: string
    user_id: string
    customer_id?: string
    customers?: Customer
    cheque_number: string
    bank_name?: string
    amount: number
    cheque_date?: string
    deposit_date?: string
    type: "receive" | "issue"
    status: "pending" | "deposited" | "cleared" | "bounced" | "cancelled"
    notes?: string
    created_at: string
}

export interface CashFlow {
    id: string
    user_id: string
    type: "income" | "expense" | "transfer"
    category?: string
    amount: number
    date: string
    reference_type?: "invoice" | "payment" | "expense" | "purchase"
    reference_id?: string
    notes?: string
    created_at: string
}
