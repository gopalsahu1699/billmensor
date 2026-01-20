"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
type Party = {
  name: string;
  billing_address?: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
};

type QuotationItem = {
  id: string;
  item_name: string;
  quantity: number;
  rate: number;
  total: number;
  hsn_sac?: string;
  image_url?: string;
};

type Quotation = {
  id: string;
  quotation_no: string;
  quotation_date: string;
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
  total_amount: number;
  terms?: string;
  items: QuotationItem[];
};

export default function PrintQuotationPage() {
  const params = useParams();
  const quotationId =
    typeof params.id === "string" ? params.id : params.id?.[0];

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const printedRef = useRef(false);

useEffect(() => {
  if (!quotationId) return;

 const fetchQuotation = async () => {
  const { data, error } = await supabase
    .from("quotations")
    .select(`
      id,
      quotation_no,
      quotation_date,
      due_date,
      subtotal,
      discount,
      gst_rate,
      gst_amount,
      additional_charge,
      total_amount,
      terms,
      parties (
        name,
        billing_address,
        shipping_address,
        city,
        state,
        pincode,
        gstin
      ),
      quotation_items (
        id,
        item_name,
        quantity,
        rate,
        total,
        hsn_sac
      )
    `)
    .eq("id", quotationId)
    .limit(1);

  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.error("Quotation not found");
    return;
  }

  const quotationData = data[0]; // ✅ Grab the first element
  const party =
    quotationData.parties && Array.isArray(quotationData.parties)
      ? quotationData.parties[0] ?? null
      : null;

  setQuotation({
    id: quotationData.id,
    quotation_no: quotationData.quotation_no,
    quotation_date: quotationData.quotation_date,
    due_date: quotationData.due_date ?? "",
    party_name: party?.name ?? "—",
    billing_address: party?.billing_address ?? "",
    shipping_address: party?.shipping_address ?? "",
    city: party?.city ?? "",
    state: party?.state ?? "",
    pincode: party?.pincode ?? "",
    party_gstin: party?.gstin ?? "",
    subtotal: quotationData.subtotal ?? 0,
    discount: quotationData.discount ?? 0,
    gst_rate: quotationData.gst_rate ?? 0,
    gst_amount: quotationData.gst_amount ?? 0,
    additional_charge: quotationData.additional_charge ?? 0,
    total_amount: quotationData.total_amount ?? 0,
    terms: quotationData.terms ?? "",
    items:
      quotationData.quotation_items?.map((i: any) => ({
        id: i.id,
        item_name: i.item_name,
        quantity: Number(i.quantity ?? 0),
        rate: Number(i.rate ?? 0),
        total: Number(i.total ?? 0),
        hsn_sac: i.hsn_sac ?? "",
      })) ?? [],
  });
};

  fetchQuotation();
}, [quotationId]);




  // ✅ Print only once
  useEffect(() => {
    if (quotation && !printedRef.current) {
      printedRef.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [quotation]);

  if (!quotation) {
    return <div className="p-6 text-center">Loading quotation…</div>;
  }


  return (
    <div className="p-6 max-w-5xl mx-auto font-sans text-sm">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotation</h1>
          <p>#{quotation.quotation_no}</p>
          <p>Date: {quotation.quotation_date}</p>
          {quotation.due_date && <p>Due Date: {quotation.due_date}</p>}
        </div>
        <div className="text-right">
          <img src="/logo.png" alt="Logo" className="h-16 mb-1" />
          <p className="font-medium">Your Company Name</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex justify-between mb-6">
        <div className="w-1/2">
          <h2 className="font-semibold">Bill To</h2>
          <p>{quotation.party_name}</p>
          <p>{quotation.billing_address}</p>
          <p>
            {quotation.city}, {quotation.state} - {quotation.pincode}
          </p>
          {quotation.party_gstin && <p>GSTIN: {quotation.party_gstin}</p>}
        </div>

        <div className="w-1/2 text-right">
          <h2 className="font-semibold">Ship To</h2>
          <p>{quotation.shipping_address || "—"}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full border border-gray-400">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">#</th>
            <th className="border px-2">Item</th>
            <th className="border px-2">HSN</th>
            <th className="border px-2 text-right">Qty</th>
            <th className="border px-2 text-right">Rate</th>
            <th className="border px-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item, idx) => (
            <tr key={item.id}>
              <td className="border px-2">{idx + 1}</td>
              <td className="border px-2">{item.item_name}</td>
              <td className="border px-2">{item.hsn_sac || "—"}</td>
              <td className="border px-2 text-right">{item.quantity}</td>
              <td className="border px-2 text-right">₹{item.rate.toFixed(2)}</td>
              <td className="border px-2 text-right">₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-1/3 space-y-1">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{quotation.subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Discount</span>
            <span>₹{quotation.discount.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>GST ({quotation.gst_rate}%)</span>
            <span>₹{quotation.gst_amount.toFixed(2)}</span>
          </p>
          <p className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{quotation.total_amount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {quotation.terms && (
        <div className="mt-6">
          <h2 className="font-semibold">Terms & Conditions</h2>
          <p>{quotation.terms}</p>
        </div>
      )}
    </div>
  );
}
