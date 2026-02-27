import { z } from "zod"

export const partySchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    gst_number: z.string().optional(),
    address: z.string().optional()
})

const itemBaseSchema = z.object({
    id: z.string().optional(),
    product_id: z.string().uuid().optional(),
    name: z.string().min(1, "Product name is required"),
    hsn_code: z.string().optional().nullable(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Price cannot be negative"),
    tax_rate: z.number().min(0),
    cgst: z.number().min(0).default(0),
    sgst: z.number().min(0).default(0),
    igst: z.number().min(0).default(0),
    tax_amount: z.number().min(0),
    discount: z.number().min(0).optional(),
    total: z.number().min(0),
    image_url: z.string().optional().nullable()
})

export const invoiceSchema = z.object({
    invoice_number: z.string().min(1, "Invoice number is required"),
    invoice_date: z.string(),
    customer_id: z.string().uuid("Customer is required").optional(),
    subtotal: z.number().min(0),
    cgst_total: z.number().min(0).default(0),
    sgst_total: z.number().min(0).default(0),
    igst_total: z.number().min(0).default(0),
    tax_total: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    round_off: z.number().optional(),
    transport_charges: z.number().min(0).optional(),
    installation_charges: z.number().min(0).optional(),
    custom_charges: z.array(z.object({ name: z.string(), amount: z.number() })).optional(),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    total_amount: z.number().positive("Total amount must be greater than 0"),
    amount_paid: z.number().min(0).optional(),
    balance_amount: z.number().min(0).optional(),
    notes: z.string().optional(),
    payment_status: z.string().optional(),
    status: z.enum(["draft", "sent", "partial", "paid", "overdue", "cancelled", "void"]).default("draft").optional(),
    items: z.array(itemBaseSchema).min(1, "At least one item is required")
})

export const purchaseSchema = z.object({
    purchase_number: z.string().min(1, "Purchase number is required"),
    purchase_date: z.string(),
    supplier_id: z.string().uuid("Supplier is required").optional(),
    subtotal: z.number().min(0),
    cgst_total: z.number().min(0).default(0),
    sgst_total: z.number().min(0).default(0),
    igst_total: z.number().min(0).default(0),
    tax_total: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    round_off: z.number().optional(),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    total_amount: z.number().positive("Total amount must be greater than 0"),
    payment_status: z.string().optional(),
    status: z.enum(["draft", "partial", "paid", "cancelled", "overdue"]).default("draft").optional(),
    items: z.array(itemBaseSchema).min(1, "At least one item is required")
})

export const returnSchema = z.object({
    return_number: z.string().min(1, "Return number is required"),
    return_date: z.string(),
    type: z.enum(["sales_return", "purchase_return"]),
    customer_id: z.string().uuid().optional(),
    subtotal: z.number().min(0),
    cgst_total: z.number().min(0).default(0),
    sgst_total: z.number().min(0).default(0),
    igst_total: z.number().min(0).default(0),
    tax_total: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    round_off: z.number().optional(),
    total_amount: z.number().positive("Total amount must be greater than 0"),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    status: z.enum(["draft", "approved", "rejected", "completed", "partial", "paid"]).default("draft").optional(),
    items: z.array(itemBaseSchema).min(1, "At least one item is required")
})

export const quotationSchema = z.object({
    quotation_number: z.string().min(1, "Quotation number is required"),
    quotation_date: z.string(),
    customer_id: z.string().uuid("Customer is required").optional(),
    expiry_date: z.string().optional().nullable(),
    subtotal: z.number().min(0),
    cgst_total: z.number().min(0).default(0),
    sgst_total: z.number().min(0).default(0),
    igst_total: z.number().min(0).default(0),
    tax_total: z.number().min(0).optional(),
    transport_charges: z.number().min(0).optional(),
    installation_charges: z.number().min(0).optional(),
    custom_charges: z.array(z.object({ name: z.string(), amount: z.number() })).optional(),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    total_amount: z.number().positive("Total amount must be greater than 0"),
    discount: z.number().min(0).optional(),
    round_off: z.number().optional(),
    notes: z.string().optional(),
    status: z.enum(["pending", "accepted", "rejected", "invoiced", "draft"]).default("draft"),
    items: z.array(itemBaseSchema).min(1, "At least one item is required")
})

export const challanSchema = z.object({
    challan_number: z.string().min(1, "Challan number is required"),
    challan_date: z.string(),
    customer_id: z.string().uuid("Customer is required").optional(),
    subtotal: z.number().min(0),
    cgst_total: z.number().min(0).default(0),
    sgst_total: z.number().min(0).default(0),
    igst_total: z.number().min(0).default(0),
    tax_total: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    round_off: z.number().optional(),
    total_amount: z.number().positive("Total amount must be greater than 0"),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    notes: z.string().optional(),
    status: z.enum(["draft", "delivered", "in_transit"]).default("draft"),
    items: z.array(itemBaseSchema).min(1, "At least one item is required")
})

export const paymentSchema = z.object({
    payment_number: z.string().min(1, "Payment number is required"),
    payment_date: z.string(),
    type: z.enum(["payment_in", "payment_out"]),
    customer_id: z.string().uuid().optional().nullable(),
    invoice_id: z.string().uuid().optional().nullable(),
    purchase_id: z.string().uuid().optional().nullable(),
    amount: z.number().positive("Amount must be greater than 0"),
    payment_mode: z.string(),
    reference_number: z.string().optional().nullable(),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    supply_place: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})
