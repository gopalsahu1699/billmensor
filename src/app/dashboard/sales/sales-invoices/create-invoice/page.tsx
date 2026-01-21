"use client";
import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import PartyDetails, { Party } from "../quotation-estimate/create-quotation/components/PartyDetails";
import AddItemSection from "../quotation-estimate/create-quotation/components/AddItemSection";
import DueDatePicker from "../quotation-estimate/create-quotation/components/DueDatePicker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= Types ================= */
type PriceType = "selling" | "mrp" | "wholesale";

interface InvoiceItem {
  id: string;
  item_id: string;
  name: string;
  hsn_sac: string;
  quantity: number;
  rate: number;
  total: number;
  stock_qty: number;
  priceType: PriceType;
  prices: {
    selling: number;
    mrp: number;
    wholesale: number;
  };
  unit: string;
  image_url?: string;
}

/* ================= Page ================= */
export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotation_id");

  const [loading, setLoading] = React.useState(false);

  const [selectedParty, setSelectedParty] = React.useState<any>(null);
  const [partySearch, setPartySearch] = React.useState("");
  const [showPartyModal, setShowPartyModal] = React.useState(false);

  const [invoiceDate, setInvoiceDate] = React.useState(new Date());
  const [dueDate, setDueDate] = React.useState<Date>();
  const [terms, setTerms] = React.useState("");

  const [items, setItems] = React.useState<InvoiceItem[]>([]);

  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [gstRate, setGstRate] = React.useState(18);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [roundOff, setRoundOff] = React.useState(false);

  const [parties, setParties] = React.useState<Party[]>([]);

  /* ================= Utils ================= */
  const n = (v: unknown) => Number(v) || 0;

  /* ================= Calculations ================= */
  const subtotal = items.reduce((s, i) => s + n(i.total), 0);

  const discount =
    discountPercent > 0
      ? (subtotal * discountPercent) / 100
      : discountAmount;

  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = (taxableAmount * gstRate) / 100;

  let totalAmount =
    taxableAmount + gstAmount + additionalCharge;

  if (roundOff) totalAmount = Math.round(totalAmount);

  /* ================= Load Quotation ================= */
  React.useEffect(() => {
    if (!quotationId) return;

    const loadQuotation = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*),
          parties (*)
        `)
        .eq("id", quotationId)
        .single();

      if (error) {
        alert("Failed to load quotation");
        return;
      }

      setSelectedParty({
        id: data.party_id,
        ...data.parties,
      });

      setTerms(data.terms || "");
      setDueDate(data.due_date ? new Date(data.due_date) : undefined);

      const mappedItems: InvoiceItem[] =
        data.quotation_items.map((i: any) => ({
          id: crypto.randomUUID(),
          item_id: i.item_id,
          name: i.item_name,
          hsn_sac: i.hsn_sac,
          quantity: i.quantity,
          rate: i.rate,
          total: i.total,
          unit: i.unit,
          stock_qty: 0,
          priceType: "selling",
          prices: {
            selling: i.rate,
            mrp: i.rate,
            wholesale: i.rate,
          },
          image_url: i.image_url,
        }));

      setItems(mappedItems);
      setDiscountAmount(data.discount || 0);
      setGstRate(data.gst_rate || 18);
      setAdditionalCharge(data.additional_charge || 0);
      setRoundOff(Boolean(data.round_off));

      setLoading(false);
    };

    loadQuotation();
  }, [quotationId]);

  /* ================= Parties ================= */
  React.useEffect(() => {
    supabase
      .from("parties")
      .select("*")
      .order("name")
      .then(({ data }) => setParties(data || []));
  }, []);

  const availableParties = React.useMemo(() => {
    const s = partySearch.toLowerCase();
    if (!s) return parties;
    return parties.filter((p) =>
      [p.name, p.phone, p.gstin].join(" ").toLowerCase().includes(s)
    );
  }, [partySearch, parties]);

  /* ================= Save Invoice ================= */
  async function handleSave() {
    if (!items.length || !selectedParty) {
      alert("Party & items required");
      return;
    }

    setLoading(true);

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        party_id: selectedParty.id,
        quotation_id: quotationId,
        invoice_date: invoiceDate,
        due_date: dueDate ?? null,
        terms,
        subtotal,
        discount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        additional_charge: additionalCharge,
        total_amount: totalAmount,
        round_off: roundOff ? 1 : 0,
      })
      .select()
      .single();

    if (error) {
      alert("Failed to save invoice");
      setLoading(false);
      return;
    }

    await supabase.from("invoice_items").insert(
      items.map((i) => ({
        invoice_id: invoice.id,
        item_id: i.item_id,
        item_name: i.name,
        hsn_sac: i.hsn_sac,
        unit: i.unit,
        quantity: i.quantity,
        rate: i.rate,
        total: i.total,
        image_url: i.image_url ?? null,
      }))
    );

    alert("Invoice created successfully ✅");
    router.push("/dashboard/sales/invoice");
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Home / Sales / Invoice / Create
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Invoice"}
        </Button>
      </div>

      <PartyDetails
        selectedParty={selectedParty}
        setSelectedParty={setSelectedParty}
        showPartyModal={showPartyModal}
        setShowPartyModal={setShowPartyModal}
        partySearch={partySearch}
        setPartySearch={setPartySearch}
        availableParties={availableParties}
      />

      <Card className="p-4">
        <label>Invoice Date</label>
        <div className="relative mt-1">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4" />
          <Input
            readOnly
            value={format(invoiceDate, "dd MMM yyyy")}
            className="pl-9"
          />
        </div>
        <DueDatePicker date={dueDate} setDate={setDueDate} />
      </Card>

      <AddItemSection
        items={items}
        subtotal={subtotal}
        updateItemQuantity={(id, q) =>
          setItems((p) =>
            p.map((i) =>
              i.id === id ? { ...i, quantity: q, total: q * i.rate } : i
            )
          )
        }
        deleteItem={(id) =>
          setItems((p) => p.filter((i) => i.id !== id))
        }
        updateItemPriceType={() => {}}
      />

      <Card className="p-4">
        <Textarea
          placeholder="Terms & Conditions"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
        />
      </Card>
    </div>
  );
}
