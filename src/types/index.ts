export interface Party {
    id: string
    name: string
    phone?: string
    email?: string
    gst_number?: string
    address?: string
}

export interface InvoiceItem {
    id: string
    product_name: string
    hsn_code?: string
    quantity: number
    price: number
    tax_rate: number
    tax_amount: number
    total: number
}

export interface Invoice {
    id: string
    invoice_number: string
    invoice_date: string
    customer_id?: string
    party_id?: string
    party?: Party
    items: InvoiceItem[]
    subtotal: number
    tax_total: number
    cgst?: number
    sgst?: number
    igst?: number
    discount?: number
    round_off?: number
    transport_charges?: number
    installation_charges?: number
    custom_charges?: { name: string, amount: number }[]
    billing_address?: string
    shipping_address?: string
    supply_place?: string
    total_amount: number
    amount_paid?: number
    balance_amount?: number
    notes?: string
    payment_status?: string
    status: "draft" | "paid" | "partial" | "overdue"
    created_at: string
}

export interface PurchaseItem {
    id: string
    product_name: string
    hsn_code?: string
    quantity: number
    price: number
    tax_rate: number
    tax_amount: number
    total: number
}

export interface Purchase {
    id: string
    purchase_number: string
    purchase_date: string
    supplier_id?: string
    suppliers?: Party
    party_id?: string
    party?: Party
    items: PurchaseItem[]
    subtotal: number
    cgst?: number
    sgst?: number
    igst?: number
    total_amount: number
    payment_status?: string
    status: "draft" | "paid" | "partial" | "overdue"
    created_at: string
}

export interface ReturnItem {
    id: string
    product_name: string
    hsn_code?: string
    quantity: number
    price: number
    tax_rate: number
    tax_amount: number
    total: number
}

export interface Return {
    id: string
    return_number: string
    return_date: string
    type: "sales_return" | "purchase_return"
    party_id?: string
    customer_id?: string
    supplier_id?: string
    party?: Party
    customers?: Party
    items: ReturnItem[]
    subtotal: number
    cgst?: number
    sgst?: number
    igst?: number
    total_amount: number
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    status: "draft" | "paid" | "partial" | "overdue"
    created_at: string
}

export interface QuotationItem {
    id: string
    product_name: string
    hsn_code?: string
    quantity: number
    price: number
    tax_rate: number
    tax_amount: number
    total: number
}

export interface Quotation {
    id: string
    quotation_number: string
    quotation_date: string
    party_id?: string
    customer_id?: string
    party?: Party
    customers?: Party
    items: QuotationItem[]
    subtotal: number
    cgst?: number
    sgst?: number
    igst?: number
    total_amount: number
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    valid_until?: string | null
    notes?: string | null
    status: "draft" | "accepted" | "rejected" | "pending"
    created_at: string
}

export interface DeliveryChallanItem {
    id: string
    product_name: string
    hsn_code?: string
    quantity: number
    price: number
    tax_rate: number
    tax_amount: number
    total: number
}

export interface DeliveryChallan {
    id: string
    challan_number: string
    challan_date: string
    party_id: string
    party?: Party
    items: DeliveryChallanItem[]
    subtotal: number
    cgst: number
    sgst: number
    igst: number
    total_amount: number
    status: "draft" | "delivered" | "in_transit"
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
    payment_number: string
    payment_date: string
    type: "payment_in" | "payment_out"
    party_id?: string
    customer_id?: string
    supplier_id?: string
    party?: Party
    customers?: Party
    invoice_id?: string
    purchase_id?: string
    amount: number
    payment_mode: string
    reference_number?: string
    billing_address?: string | null
    shipping_address?: string | null
    supply_place?: string | null
    notes?: string | null
    items?: PaymentItem[]
    created_at: string
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    billing_address?: string;
    shipping_address?: string;
    supply_place?: string;
    category?: string;
    created_at: string;
}

export interface Profile {
    id: string;
    company_name: string;
    email: string;
    phone?: string;
    gstin?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    bank_branch?: string;
    upi_id?: string;
    upi_qr_code_url?: string;
    created_at: string;
}
