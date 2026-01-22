
"use client";
import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Plus, Barcode, X, CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import DueDatePicker from "./components/DueDatePicker";
import PartyDetails, { Party } from "./components/PartyDetails";
import AddItemSection from "./components/AddItemSection";




import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as DateCalendar } from "@/components/ui/calendar";




/* ================= Page ================= */
export default function CreateSalesInvoicePage() {
  /* ================= STATE ================= */
  const [loading, setLoading] = React.useState(false);
  const [selectedParty, setSelectedParty] = React.useState<any>(null);
  const [partySearch, setPartySearch] = React.useState("");
  
const [showPartyModal, setShowPartyModal] = React.useState(false);
 const [searchTerm, setSearchTerm] = React.useState("");
  const [showItemSearch, setShowItemSearch] = React.useState(false);
  const [availableItems, setAvailableItems] = React.useState<any[]>([]);
const [parties, setParties] = React.useState<Party[]>([]);

  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [gstRate, setGstRate] = React.useState(18);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [roundOff, setRoundOff] = React.useState(false);
  const [items, setItems] = React.useState<InvoiceItem[]>([]);
const [invoiceDate, setInvoiceDate] = React.useState(new Date());
  
  const [dueDate, setDueDate] = React.useState<Date>();
  
  const [terms, setTerms] = React.useState("");
  const [additionalChargeLabel, setAdditionalChargeLabel] = React.useState("");



const searchParams = useSearchParams();
const invoiceId = searchParams.get("invoiceId");
const quotationId = searchParams.get("quotation_id");

React.useEffect(() => {
  if (!quotationId || invoiceId) return;

  const fetchQuotation = async () => {
    setLoading(true);

    try {
      // 1️⃣ Fetch quotation
      const { data: quotation, error: qErr } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (qErr) {
  console.error("Quotation fetch error:", qErr);
  throw qErr;
}

if (!quotation) {
  throw new Error("Quotation not found");
}


      // 2️⃣ Fetch party
      const { data: party, error: pErr } = await supabase
        .from("parties")
        .select("*")
        .eq("id", quotation.party_id)
        .single();

      if (pErr) throw pErr;

      // 3️⃣ Fetch quotation items
      const { data: qItems, error: iErr } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId);

      if (iErr) throw iErr;

      /* ================= PREFILL STATE ================= */

      setSelectedParty({
        id: quotation.party_id,
        ...party,
      });

      setInvoiceDate(new Date());
      setDueDate(undefined);
      setTerms(quotation.terms || "");

      setItems(
        (qItems || []).map((item: any) => ({
          id: crypto.randomUUID(),
          item_id: item.item_id,
          name: item.item_name,
          hsn_sac: item.hsn_sac,
          unit: item.unit ?? "PCS",
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          total: Number(item.total),
          priceType: "selling",
          prices: {
            selling: Number(item.rate),
            mrp: Number(item.rate),
            wholesale: Number(item.rate),
          },
          stock_qty: 0,
          image_url: item.image_url,
        }))
      );

      setDiscountAmount(quotation.discount || 0);
      setDiscountPercent(0);
      setGstRate(quotation.gst_rate || 18);
      setAdditionalCharge(quotation.additional_charge || 0);
      setAdditionalChargeLabel(
        quotation.additional_charge_label || ""
      );
      setRoundOff(false);

    } catch (err) {
      console.error("Quotation load failed:", err);
      alert("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  fetchQuotation();
}, [quotationId, invoiceId]);




React.useEffect(() => {
  if (!invoiceId) return;

  const fetchInvoice = async () => {
    setLoading(true);
    try {
    const { data, error } = await supabase
    
  .from("sales_invoices")
  .select(`
    *,
    parties (*),
    sales_invoice_items (*)
  `)


  .eq("id", invoiceId)
  .single();


      if (error) throw error;

      setSelectedParty({
        id: data.party_id,
        ...data.parties,
      });

      setInvoiceDate(new Date(data.invoice_date));
      setDueDate(data.due_date ? new Date(data.due_date) : undefined);
      setTerms(data.terms || "");
      setItems([]);
setItems(
  data.sales_invoice_items.map((item: any) => ({
    id: crypto.randomUUID(),        // UI-only ID
    item_id: item.item_id,
    name: item.item_name,
    hsn_sac: item.hsn_sac,
    unit: item.unit ?? "PCS",
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    total: Number(item.total),
    priceType: "selling",
    prices: {
      selling: Number(item.rate),
      mrp: Number(item.rate),
      wholesale: Number(item.rate),
    },
    stock_qty: 0,
    image_url: item.image_url,
  }))
);



      setDiscountAmount(data.discount || 0);
      setGstRate(data.gst_rate || 18);
      setAdditionalCharge(data.additional_charge || 0);
      setRoundOff(Boolean(data.round_off));

    } catch (err) {
      console.error(err);
      alert("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  fetchInvoice();
}, [invoiceId]);



  // Items state - FIXED
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
  image_url?: string;
  unit: string;
}

 


/* ================= CALCULATIONS ================= */
const n = (v: unknown) => Number(v) || 0;


const subtotal = items.reduce(
  (sum, item) => sum + n(item.total),
  0
);

const discount =
  n(discountPercent) > 0
    ? (subtotal * n(discountPercent)) / 100
    : n(discountAmount);

const taxableAmount = Math.max(0, subtotal - discount);

const gstAmount = (taxableAmount * n(gstRate)) / 100;

let totalAmount =
  taxableAmount + gstAmount + n(additionalCharge);

if (roundOff) {
  totalAmount = Math.round(totalAmount);
}


/* ================= PARTY SEARCH ================= */
const fetchParties = async (): Promise<Party[]> => {
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
};

React.useEffect(() => {
  const load = async () => {
    try {
      const data = await fetchParties();
      setParties(data);
    } catch (err) {
      console.error(err);
    }
  };
  load();
}, []);



const availableParties = React.useMemo(() => {
  const search = partySearch.trim().toLowerCase();

  if (!search) return parties; // ✅ show all parties if search is empty

  return parties.filter((p) => {
    const combined = [p.name, p.phone, p.gstin]
      .filter(Boolean) // remove undefined/null
      .join(" ")
      .toLowerCase();
    return combined.includes(search);
  });
}, [parties, partySearch]);



  /* ================= FIXED ITEM SEARCH ================= */
 React.useEffect(() => {
  if (searchTerm.trim().length < 2) {
    setAvailableItems([]);
    return;
  }

  const fetchItems = async () => {
    console.log("Searching items for:", searchTerm);

    const { data, error } = await supabase
      .from("items")
      .select(`
        id,
        name,
        image_url,
        hsn_sac,
        selling_price,
        mrp,
        wholesale_price,
        gst_rate,
        unit,
        stock_qty,
        barcode
      `)
      .or(
        `name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (error) {
      console.error("Item search error:", error);
      return;
    }

    console.log("Items found:", data);
    setAvailableItems(data ?? []);
  };

  const timeoutId = setTimeout(fetchItems, 300);
  return () => clearTimeout(timeoutId);
}, [searchTerm]);


  /* ================= ITEM ACTIONS ================= */
  const addItem = (item: any) => {
const newItem: InvoiceItem = {
  id: crypto.randomUUID(),
  item_id: item.id,
  name: item.name,
  hsn_sac: item.hsn_sac,
  quantity: 1,
  priceType: "selling",
  prices: {
    selling: item.selling_price,
    mrp: item.mrp,
    wholesale: item.wholesale_price,
  },
  rate: item.selling_price,
  total: item.selling_price,
  stock_qty: item.stock_qty,
  image_url: item.image_url,
  unit: item.unit,
};


    setItems((prev) => [...prev, newItem]);
    setSearchTerm("");
    setShowItemSearch(false);
  };

const updateItemQuantity = (id: string, qty: number) => {
  setItems((prev) =>
    prev.map((item) => {
      if (item.id !== id) return item;

      const quantity = qty > 0 ? qty : 1;
      const total = item.rate * quantity;

      return {
        ...item,
        quantity,
        total,
      };
    })
  );
};


const updateItemPriceType = (id: string, priceType: PriceType) => {
  setItems((prev) =>
    prev.map((item) => {
      if (item.id !== id) return item;

      const rate = item.prices[priceType];
      const total = rate * item.quantity;

      return {
        ...item,
        priceType,
        rate,
        total,
      };
    })
  );
};




  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };



const router = useRouter(); // inside your component

/* ================= SAVE TO SUPABASE ================= */
async function handleSave() {
  if (!selectedParty) return alert("Select party");
  if (!items.length) return alert("Add items");

  setLoading(true);
  try {
    let invoice;

    if (invoiceId) {
      // UPDATE
     const { data, error } = await supabase
  .from("sales_invoices")
  .update({
    party_id: selectedParty.id,
    invoice_date: invoiceDate,
    due_date: dueDate ?? null,
    terms,
    subtotal,
    discount,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    additional_charge: additionalCharge,
    additional_charge_label: additionalChargeLabel,
    total_amount: totalAmount,
    round_off: roundOff ? 1 : 0,
  })
  .eq("id", invoiceId)
  .select(`
    *,
    parties (*),
    sales_invoice_items (*)
  `)
  .single();


     if (error) {
  console.error("Supabase error:", error);
  throw error;
}

      invoice = data;

      await supabase
  .from("sales_invoice_items")
  .delete()
  .eq("sales_invoice_id", invoiceId);


    } else {
      // CREATE
      const { data, error } = await supabase
        .from("sales_invoices")
        .insert({
          party_id: selectedParty.id,
          invoice_date: invoiceDate,
          due_date: dueDate ?? null,
          terms,
          subtotal,
          discount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          additional_charge: additionalCharge,
          additional_charge_label: additionalChargeLabel,
          total_amount: totalAmount,
          round_off: roundOff ? 1 : 0,
        })
        .select()
        .single();

      if (error) throw error;
      invoice = data;
    }

const invoiceItems = items.map((item) => ({
  sales_invoice_id: invoice.id, // ✅ MUST use this
  item_id: item.item_id,
  item_name: item.name,
  hsn_sac: item.hsn_sac,
  unit: item.unit,
  quantity: item.quantity,
  rate: item.rate,
  total: item.total,
  image_url: item.image_url ?? null,
}));





const { error } = await supabase
  .from("sales_invoice_items")
  .insert(invoiceItems);

if (error) throw error;


    alert("Invoice saved successfully ✅");
    router.push("/dashboard/sales/sales-invoices");

  } 
  
 catch (err: any) {
  console.error("Supabase error:", err);

  alert(
    err?.message ||
    err?.details ||
    err?.hint ||
    "Failed to save invoice"
  );
}

}




 


  return (
    <div className="space-y-6">
      {/* ================= Header ================= */}
      <div className="flex items-center justify-between">
        <div>
         <h1 className="text-2xl font-semibold">
  {invoiceId
    ? "Edit Sales Invoice"
    : quotationId
    ? "Create Invoice from Quotation"
    : "Create Sales Invoice"}
</h1>

<p className="text-sm text-muted-foreground">
  Home / Sales / Invoice / Create
</p>
        </div>

        <div className="flex gap-2">
         <Button
  variant="outline"
  onClick={() => router.push("/dashboard/sales/sales-invoices")}
>
  Cancel
</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Data"}
          </Button>
        </div>
      </div>

     {/* ================= Party & Date ================= */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <PartyDetails
    selectedParty={selectedParty}
    setSelectedParty={setSelectedParty}
    showPartyModal={showPartyModal}
    setShowPartyModal={setShowPartyModal}
    partySearch={partySearch}
    setPartySearch={setPartySearch}
    availableParties={availableParties}
  />

  <div className="hidden lg:block" />

  {/* Date Card stays as-is */}
   <Card className="p-6 space-y-4">
    <div>
      <label className="text-sm font-medium">Invoice Date</label>
      <div className="relative mt-1">
        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          readOnly
         value={format(invoiceDate, "dd MMM yyyy")}

          className="pl-9"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium">Due Date</label>
        <DueDatePicker date={dueDate} setDate={setDueDate} />
      </div>
    </div>
  </Card>
</div>



      {/* ================= Items Table ================= */}
     <AddItemSection
  items={items}
  subtotal={subtotal}
  searchTerm={searchTerm}
  showItemSearch={showItemSearch}
  availableItems={availableItems}
  setSearchTerm={setSearchTerm}
  setShowItemSearch={setShowItemSearch}
  addItem={addItem}
  deleteItem={deleteItem}
  updateItemQuantity={updateItemQuantity}
  updateItemPriceType={updateItemPriceType}

/>




      {/* ================= Notes & Summary ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4 space-y-3">
          <label className="text-sm font-medium">Terms</label>
          <Textarea
            rows={6}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Taxable Amount</span>
            <span>₹ {n(taxableAmount).toFixed(2)}</span>

          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <p>Discount</p>
            <Input
              className="w-20"
              value={discountPercent}
              onChange={(e) => {
                setDiscountPercent(+e.target.value);
                setDiscountAmount(0);
              }}
            />
            <span>%</span>
            <Input
              className="w-24"
              value={discountAmount}
              onChange={(e) => {
                setDiscountAmount(+e.target.value);
                setDiscountPercent(0);
              }}
            />
            <span>₹</span>
            <X
              className="cursor-pointer"
              onClick={() => {
                setDiscountAmount(0);
                setDiscountPercent(0);
              }}
            />
          </div>

          {/* GST */}
          <div className="flex items-center gap-2">
            <Select
              value={String(gstRate)}
              onValueChange={(v) => setGstRate(+v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="GST @ 18%" />
              </SelectTrigger>
              <SelectContent>
                {[0, 5, 12, 18, 28].map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    GST @ {g}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <X className="h-4 w-4 text-muted-foreground" />
          </div>

      
        {/* Additional Charges */}
<div className="flex items-center gap-2">
  <Input
    placeholder="Enter charge (ex. Transport)"
    value={additionalChargeLabel}
    onChange={(e) => setAdditionalChargeLabel(e.target.value)}
  />

  <Input
    placeholder="0"
    className="w-24"
    value={additionalCharge}
    onChange={(e) => setAdditionalCharge(Number(e.target.value) || 0)}
  />

  <X
    className="cursor-pointer"
    onClick={() => {
      setAdditionalCharge(0);
      setAdditionalChargeLabel("");
    }}
  />
</div>


          {/* Round Off */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={roundOff}
              onCheckedChange={(v) => setRoundOff(!!v)}
            />
            <span className="text-sm">Round Off</span>
          </div>

          <hr />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total Amount</span>
           <span>₹ {n(totalAmount).toFixed(2)}</span>

          </div>
        </Card>
      </div>

      {/* ================= Footer ================= */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={loading}
        >
          Save Data
        </Button>
      </div>
    </div>
  );
}