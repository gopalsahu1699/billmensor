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

export default function PrintSalesInvoicePage() {
  const params = useParams();
  const invoiceId =
    typeof params.id === "string" ? params.id : params.id?.[0];

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const printedRef = useRef(false);

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
            <h1 className="text-2xl font-bold">Tax Invoice</h1>
            <p>Invoice No: {invoice.invoice_no}</p>
            <p>Date: {invoice.invoice_date}</p>
            {invoice.due_date && <p>Due Date: {invoice.due_date}</p>}
          </div>

          <div className="text-right">
            <img src="/logo.png" alt="Logo" className="h-16 mb-1" />
            <p className="font-medium">Your Company Name</p>
          </div>
        </div>

        {/* ================= ADDRESSES ================= */}
        <div className="flex justify-between mb-6">
          <div className="w-1/2">
            <h2 className="font-semibold">Bill To</h2>
            <p>{invoice.party_name}</p>
            <p>{invoice.billing_address}</p>
            <p>
              {invoice.city}, {invoice.state} - {invoice.pincode}
            </p>
            {invoice.party_gstin && (
              <p>GSTIN: {invoice.party_gstin}</p>
            )}
          </div>

          <div className="w-1/2 text-right">
            <h2 className="font-semibold">Ship To</h2>
            <p>{invoice.shipping_address}</p>
          </div>
        </div>

        {/* ================= ITEMS ================= */}
        <table className="w-full border border-gray-400">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2">#</th>
              <th className="border px-2">Image</th>
              <th className="border px-2">Item</th>
              <th className="border px-2">HSN</th>
              <th className="border px-2 text-right">Qty</th>
              <th className="border px-2 text-right">Rate</th>
              <th className="border px-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border px-2">{idx + 1}</td>
                <td className="border px-2">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border px-2">{item.item_name}</td>
                <td className="border px-2">{item.hsn_sac}</td>
                <td className="border px-2 text-right">
                  {item.quantity}
                </td>
                <td className="border px-2 text-right">
                  ₹{item.rate.toFixed(2)}
                </td>
                <td className="border px-2 text-right">
                  ₹{item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= TOTALS ================= */}
        <div className="mt-4 flex justify-end">
          <div className="w-1/3 space-y-1">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </p>

            {invoice.discount > 0 && (
              <p className="flex justify-between">
                <span>Discount</span>
                <span>₹{invoice.discount.toFixed(2)}</span>
              </p>
            )}

            <p className="flex justify-between">
              <span>GST ({invoice.gst_rate}%)</span>
              <span>₹{invoice.gst_amount.toFixed(2)}</span>
            </p>

            {invoice.additional_charge > 0 && (
              <p className="flex justify-between">
                <span>{invoice.additional_charge_label}</span>
                <span>
                  ₹{invoice.additional_charge.toFixed(2)}
                </span>
              </p>
            )}

            <hr />

            <p className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{invoice.total_amount.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* ================= TERMS ================= */}
        {invoice.terms && (
          <div className="mt-6">
            <h2 className="font-semibold">Terms & Conditions</h2>
            <p>{invoice.terms}</p>
          </div>
        )}
      </div>

      {/* ================= PRINT STYLES ================= */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
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
          }
        }
      `}</style>
    </>
  );
}
