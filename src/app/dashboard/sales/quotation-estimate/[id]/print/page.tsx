"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Head from "next/head";

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
  additional_charge_label: string;
  total_amount: number;
  terms?: string;
  items: QuotationItem[];
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


export default function PrintQuotationPage() {
  const params = useParams();
  const quotationId = typeof params.id === "string" ? params.id : params.id?.[0];
  const [bank, setBank] = useState<BankDetails | null>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const printedRef = useRef(false);
  const [ids, setIds] = useState<
    { id_type: string; id_value: string; show_on_invoice: boolean }[]
  >([]);


  useEffect(() => {
    if (!quotationId) return;

    const fetchQuotation = async () => {
      try {
        const { data, error } = await supabase
          .from("quotations")
          .select(`
            *,
            party:parties(id, name, billing_address, shipping_address, city, state, pincode, gstin),
            quotation_items(*)
          `)
          .eq("id", quotationId)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          return;
        }

        const party = data.party;

        setQuotation({
          id: data.id,
          quotation_no: data.quotation_no,
          quotation_date: data.quotation_date,
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
          additional_charge_label: data.additional_charge_label ?? "-",
          total_amount: data.total_amount ?? 0,
          terms: data.terms ?? "",
          items:
            data.quotation_items?.map((i: any) => ({
              id: i.id,
              item_name: i.item_name,
              quantity: Number(i.quantity ?? 0),
              rate: Number(i.rate ?? 0),
              total: Number(i.total ?? 0),
              hsn_sac: i.hsn_sac ?? "—",
              image_url: i.image_url ?? "",
            })) ?? [],
        });
      } catch (err) {
        console.error("Fetch quotation failed:", err);
      }
    };

    fetchQuotation();
  }, [quotationId]);


  // Fetch company info
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data, error } = await supabase
          .from("company_settings")
          .select("company_name, company_address, phone_number, email_id, logo_url, gst_value")
          .single();

        if (error) {
          console.error("Error fetching company settings:", error);
          return;
        }

        setCompany(data);
      } catch (err) {
        console.error("Failed to fetch company:", err);
      }
    };

    fetchCompany();
  }, []);

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





  // ---------- AUTO PRINT ----------
  useEffect(() => {
    if (quotation && !printedRef.current) {
      printedRef.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [quotation]);


  if (!quotation) return <div className="p-6 text-center">Loading quotation…</div>;


  return (
    <>
      <Head>
        <title>Quotation #{quotation?.quotation_no}</title>
      </Head>
      <div
        id="print-container"
        className="p-6 max-w-5xl mx-auto font-sans text-sm"
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold italic text-blue-900 uppercase">Quotation</h1>
            <p className="mt-1">Quotation No: <span className="font-semibold">#{quotation.quotation_no}</span></p>
            <p>Date: {quotation.quotation_date}</p>
            {quotation.due_date && <p>Due Date: {quotation.due_date}</p>}
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
            {company?.gst_value && <p className="text-xs font-medium">GSTIN: {company.gst_value}</p>}
            {company?.company_address && (
              <p className="text-xs max-w-[250px] ml-auto whitespace-pre-line text-gray-600">{company.company_address}</p>
            )}
            {company?.phone_number && <p className="text-xs">📞 {company.phone_number}</p>}
            {company?.email_id && <p className="text-xs">✉️ {company.email_id}</p>}
          </div>
        </div>

        {/* ================= ADDRESSES ================= */}
        <div className="flex justify-between mb-8 border-t border-b border-gray-200 py-4">
          <div className="w-1/2">
            <h2 className="font-bold text-gray-500 uppercase text-xs mb-2">Quotation To</h2>
            <div className="space-y-1">
              <p className="font-bold text-base text-gray-800">{quotation.party_name}</p>
              <p className="text-gray-600">{quotation.billing_address}</p>
              <p className="text-gray-600">
                {quotation.city}, {quotation.state} - {quotation.pincode}
              </p>
              {quotation.party_gstin && (
                <p className="font-medium text-gray-700">GSTIN: {quotation.party_gstin}</p>
              )}
            </div>
          </div>

          <div className="w-1/2 text-right">
            <h2 className="font-bold text-gray-500 uppercase text-xs mb-2">Ship To</h2>
            <div className="space-y-1 text-gray-600">
              <p className="whitespace-pre-line">{quotation.shipping_address || "Same as billing"}</p>
            </div>
          </div>
        </div>

        {/* ================= ITEMS ================= */}
        <table className="w-full border-collapse border border-gray-400 mb-8">
          <thead className="bg-gray-50 font-bold uppercase text-xs">
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-left w-10">#</th>
              <th className="border border-gray-400 px-3 py-2 text-left w-16">Image</th>
              <th className="border border-gray-400 px-3 py-2 text-left">Item Name / Description</th>
              <th className="border border-gray-400 px-3 py-2 text-left w-24">HSN</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-20">Qty</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-28">Rate</th>
              <th className="border border-gray-400 px-3 py-2 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, idx) => (
              <tr key={item.id} className="text-sm">
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
                <td className="border border-gray-400 px-3 py-2 font-medium">{item.item_name}</td>
                <td className="border border-gray-400 px-3 py-2 text-gray-600">{item.hsn_sac || "—"}</td>
                <td className="border border-gray-400 px-3 py-2 text-right">{item.quantity}</td>
                <td className="border border-gray-400 px-3 py-2 text-right text-gray-700">₹{item.rate.toFixed(2)}</td>
                <td className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-800">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-start gap-12 pt-4 border-t border-gray-200">
          {/* Left: Bank Details */}
          <div className="w-1/2">
            {bank ? (
              <div className="p-4 bg-blue-50/30 rounded-lg border border-blue-100 space-y-1 text-xs">
                <p className="font-bold text-blue-900 mb-2 uppercase tracking-wide">Bank Details</p>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-gray-700">
                  <span className="font-semibold">A/c Name:</span> <span>{bank.account_holder_name}</span>
                  <span className="font-semibold">A/c Number:</span> <span>{bank.account_number}</span>
                  <span className="font-semibold">IFSC Code:</span> <span>{bank.ifsc_code}</span>
                  <span className="font-semibold">Bank Name:</span> <span>{bank.bank_branch_name}</span>
                  {bank.upi_id && <><span className="font-semibold">UPI ID:</span> <span>{bank.upi_id}</span></>}
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-xs text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Bank information not available
              </div>
            )}
          </div>

          {/* Right: Totals */}
          <div className="w-1/3 space-y-2">
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500 uppercase text-[10px] font-bold">Sub-total</span>
              <span className="font-medium">₹{quotation.subtotal.toFixed(2)}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm py-1 border-b border-gray-100 text-red-600">
                <span className="uppercase text-[10px] font-bold">Discount</span>
                <span>- ₹{quotation.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500 uppercase text-[10px] font-bold">GST ({quotation.gst_rate}%)</span>
              <span className="font-medium">₹{quotation.gst_amount.toFixed(2)}</span>
            </div>
            {quotation.additional_charge > 0 && (
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-500 uppercase text-[10px] font-bold">{quotation.additional_charge_label || "Additional Charges"}</span>
                <span className="font-medium">₹{quotation.additional_charge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black py-4 text-blue-900 leading-none items-center mt-2 border-t-2 border-blue-900 border-double">
              <span className="uppercase text-xs">Total Amount</span>
              <span>₹{quotation.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ================= TERMS ================= */}
        {quotation.terms && (
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h2 className="font-bold text-gray-800 text-xs uppercase mb-3 tracking-widest">Terms & Conditions</h2>
            <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed italic bg-gray-50/50 p-4 rounded-lg">
              {quotation.terms}
            </div>
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
          .bg-blue-50 { background-color: #eff6ff !important; }
          .text-blue-900 { color: #1e3a8a !important; }
          .text-red-600 { color: #dc2626 !important; }
          .border-gray-400 { border-color: #9ca3af !important; }
        }
      `}</style>
    </>
  );

}
