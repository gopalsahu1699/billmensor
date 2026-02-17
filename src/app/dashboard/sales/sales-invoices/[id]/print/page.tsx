"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import { supabase } from "@/lib/supabase";

type InvoiceItem = {
  id: string;
  item_name: string;
  quantity: number;
  rate: number;
  total: number;
  hsn_sac?: string;
  image_url?: string;
};

type SalesInvoice = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  due_date?: string;

  party_name: string;
  billing_address?: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  party_gstin?: string;

  subtotal: number;
  discount: number;
  gst_rate: number;
  gst_amount: number;
  additional_charge: number;
  additional_charge_label?: string;
  total_amount: number;

  terms?: string;
  items: InvoiceItem[];
};

type Company = {
  company_name: string;
  gst_value: string;
  company_address?: string | null;
  phone_number?: string | null;
  email_id?: string | null;
  logo_url?: string | null;
};

type BankDetails = {
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  bank_branch_name: string;
  upi_id?: string | null;
};


export default function PrintSalesInvoicePage() {
  const params = useParams();
  const invoiceId =
    typeof params.id === "string" ? params.id : params.id?.[0];

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const printedRef = useRef(false);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("company_name, company_address, phone_number, email_id, logo_url, gst_value")
        .single();

      if (error) {
        console.error("Failed to fetch company:", error);
        return;
      }

      setCompany(data);
    };

    fetchCompany();
  }, []);


  /* ================= FETCH INVOICE ================= */
  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          party:parties(
            name,
            billing_address,
            shipping_address,
            city,
            state,
            pincode,
            gstin
          ),
          sales_invoice_items(*)
        `)
        .eq("id", invoiceId)
        .single();

      if (error || !data) {
        console.error("Failed to fetch invoice:", error);
        return;
      }

      const party = data.party;

      setInvoice({
        id: data.id,
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date ?? "",

        party_name: party?.name ?? "—",
        billing_address: party?.billing_address ?? "—",
        shipping_address: party?.shipping_address ?? "—",
        city: party?.city ?? "",
        state: party?.state ?? "",
        pincode: party?.pincode ?? "",
        party_gstin: party?.gstin ?? "",

        subtotal: data.subtotal ?? 0,
        discount: data.discount ?? 0,
        gst_rate: data.gst_rate ?? 0,
        gst_amount: data.gst_amount ?? 0,
        additional_charge: data.additional_charge ?? 0,
        additional_charge_label:
          data.additional_charge_label ?? "Additional Charges",
        total_amount: data.total_amount ?? 0,

        terms: data.terms ?? "",
        items:
          data.sales_invoice_items?.map((i: any) => ({
            id: i.id,
            item_name: i.item_name,
            quantity: Number(i.quantity ?? 0),
            rate: Number(i.rate ?? 0),
            total: Number(i.total ?? 0),
            hsn_sac: i.hsn_sac ?? "—",
            image_url: i.image_url ?? "",
          })) ?? [],
      });
    };

    fetchInvoice();
  }, [invoiceId]);


  useEffect(() => {
    if (!company) return;

    const fetchBank = async () => {
      try {
        const { data, error } = await supabase
          .from("company_bank_details")
          .select(
            "account_number, account_holder_name, ifsc_code, bank_branch_name, upi_id"
          )
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Bank fetch error:", error);
          return;
        }

        setBank(data ?? null);
      } catch (err) {
        console.error("Failed to fetch bank:", err);
      }
    };

    fetchBank();
  }, [company]);

  /* ================= AUTO PRINT ================= */
  useEffect(() => {
    if (invoice && !printedRef.current) {
      printedRef.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [invoice]);

  if (!invoice) {
    return <div className="p-6 text-center">Loading invoice…</div>;
  }

  return (
    <>
      <Head>
        <title>Invoice #{invoice.invoice_no}</title>
      </Head>

      <div
        id="print-container"
        className="p-6 max-w-5xl mx-auto font-sans text-sm"
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold italic">Tax Invoice</h1>
            <p className="mt-1">Invoice No: <span className="font-semibold">#{invoice.invoice_no}</span></p>
            <p>Invoice Date: {invoice.invoice_date}</p>
            {invoice.due_date && <p>Due Date: {invoice.due_date}</p>}
          </div>

          <div className="text-right space-y-1">
            {company?.logo_url && (
              <img
                src={company.logo_url}
                alt="Company Logo"
                className="w-40 ml-auto object-contain mb-2"
              />
            )}
            <p className="font-bold text-lg uppercase">{company?.company_name}</p>
            {company?.gst_value && <p className="text-xs">GSTIN: {company.gst_value}</p>}
            {company?.company_address && (
              <p className="text-xs max-w-[250px] ml-auto whitespace-pre-line">{company.company_address}</p>
            )}
            {company?.phone_number && <p className="text-xs">📞 {company.phone_number}</p>}
            {company?.email_id && <p className="text-xs">✉️ {company.email_id}</p>}
          </div>
        </div>

        {/* ================= ADDRESSES ================= */}
        <div className="flex justify-between mb-8 border-t border-b border-gray-200 py-4">
          <div className="w-1/2">
            <h2 className="font-bold text-gray-600 uppercase text-xs mb-2">Bill To</h2>
            <div className="space-y-1">
              <p className="font-bold text-base">{invoice.party_name}</p>
              <p className="text-gray-600">{invoice.billing_address}</p>
              <p className="text-gray-600">
                {invoice.city}, {invoice.state} - {invoice.pincode}
              </p>
              {invoice.party_gstin && (
                <p className="font-medium">GSTIN: {invoice.party_gstin}</p>
              )}
            </div>
          </div>

          <div className="w-1/2 text-right">
            <h2 className="font-bold text-gray-600 uppercase text-xs mb-2">Ship To</h2>
            <div className="space-y-1">
              <p className="text-gray-600 whitespace-pre-line">{invoice.shipping_address || "Same as billing"}</p>
            </div>
          </div>
        </div>

        {/* ================= ITEMS ================= */}
        <table className="w-full border-collapse border border-gray-400 mb-8">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-left w-10">#</th>
              <th className="border border-gray-400 px-3 py-2 text-left w-16">Image</th>
              <th className="border border-gray-400 px-3 py-2 text-left">Item / Description</th>
              <th className="border border-gray-400 px-3 py-2 text-left w-24">HSN/SAC</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-20">Qty</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-28">Rate</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-32">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-3 py-2 text-center">{idx + 1}</td>
                <td className="border border-gray-400 px-3 py-2">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-12 h-12 object-contain mx-auto"
                    />
                  ) : (
                    <div className="text-center text-gray-400">—</div>
                  )}
                </td>
                <td className="border border-gray-400 px-3 py-2">
                  <p className="font-semibold">{item.item_name}</p>
                </td>
                <td className="border border-gray-400 px-3 py-2">{item.hsn_sac || "—"}</td>
                <td className="border border-gray-400 px-3 py-2 text-right">{item.quantity}</td>
                <td className="border border-gray-400 px-3 py-2 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="border border-gray-400 px-3 py-2 text-right font-semibold">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-start gap-12 pt-4 border-t border-gray-200">
          {/* Left: Bank Details */}
          <div className="w-1/2">
            {bank ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-1 text-xs">
                <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide">Bank Details</p>
                <p><span className="font-semibold text-gray-600">A/c Name:</span> {bank.account_holder_name}</p>
                <p><span className="font-semibold text-gray-600">A/c Number:</span> {bank.account_number}</p>
                <p><span className="font-semibold text-gray-600">IFSC Code:</span> {bank.ifsc_code}</p>
                <p><span className="font-semibold text-gray-600">Bank Name:</span> {bank.bank_branch_name}</p>
                {bank.upi_id && <p><span className="font-semibold text-gray-600">UPI ID:</span> {bank.upi_id}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No bank details provided.</p>
            )}
          </div>

          {/* Right: Totals */}
          <div className="w-1/3 space-y-2">
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-600">Sub-total</span>
              <span className="font-medium">₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm py-1 border-b border-gray-100 text-red-600">
                <span>Discount</span>
                <span>- ₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-600">GST ({invoice.gst_rate}%)</span>
              <span className="font-medium">₹{invoice.gst_amount.toFixed(2)}</span>
            </div>
            {invoice.additional_charge > 0 && (
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">{invoice.additional_charge_label || "Additional Charges"}</span>
                <span className="font-medium">₹{invoice.additional_charge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold py-3 text-blue-900">
              <span>Total</span>
              <span>₹{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ================= TERMS ================= */}
        {invoice.terms && (
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h2 className="font-bold text-gray-700 text-sm uppercase mb-2">Terms & Conditions</h2>
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-container,
          #print-container * {
            visibility: visible;
          }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .text-blue-900 { color: #1e3a8a !important; }
          .text-red-600 { color: #dc2626 !important; }
        }
      `}</style>
    </>
  );
}
