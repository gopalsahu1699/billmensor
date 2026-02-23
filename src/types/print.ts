export interface Profile {
    company_name?: string
    address?: string
    gstin?: string
    phone?: string
    email?: string
    logo_url?: string
    signature_url?: string
    terms_and_conditions?: string
    print_template?: string
    show_transport?: boolean
    show_installation?: boolean
    show_bank_details?: boolean
    show_upi_qr?: boolean
    show_terms?: boolean
    show_signature?: boolean
    show_custom_fields?: boolean
    custom_field_1_label?: string
    custom_field_1_value?: string
    custom_field_2_label?: string
    custom_field_2_value?: string
}

export interface BankDetails {
    account_number: string
    ifsc_code: string
    bank_branch_name: string
    account_holder_name?: string
    upi_id?: string
}

export interface Item {
    item_name?: string
    name?: string
    hsn_code?: string
    quantity: number
    unit_price?: number
    rate?: number
    tax_rate?: number
    tax_amount?: number
    discount?: number
    total: number
    image_url?: string
    product_id?: string
}


export interface InvoiceData {
    id: string
    user_id: string
    invoice_number?: string
    invoice_date?: string
    quotation_number?: string
    quotation_date?: string
    payment_status?: 'paid' | 'unpaid' | 'partially_paid' | 'overdue'
    subtotal: number
    tax_total?: number
    gst_amount?: number
    round_off?: number
    discount: number
    total_amount: number
    status?: string
    amount_paid?: number
    balance_amount?: number
    transport_charges: number
    installation_charges: number
    custom_charges?: { name: string; amount: number }[]
    billing_address?: string
    shipping_address?: string
    notes?: string
    customer_id?: string
    supply_place?: string
    parties?: {
        name: string
        billing_address: string
        shipping_address?: string
        gstin?: string
    }
    customers?: {
        id: string
        name: string
        billing_address?: string
        shipping_address?: string
        gstin?: string
        email?: string
        phone?: string
        supply_place?: string
    }
}

export interface Settings {
    show_bank_details: boolean
    show_signature: boolean
    show_terms?: boolean
    show_custom_fields?: boolean
    show_upi_qr?: boolean
    show_transport?: boolean
    show_installation?: boolean
}

export interface PrintTemplateProps {
    data: InvoiceData
    profile?: Profile | null
    bankDetails?: BankDetails
    items: Item[]
    settings: Settings
    type: 'invoice' | 'quotation'
}
