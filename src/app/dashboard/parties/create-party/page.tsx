"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AddressSection from "./components/AddressSection";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";

export default function CreatePartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    contact_name: "",
    business_name: "",
    party_category: "customer",
    place_of_supply: "",
    phone: "",
    email: "",
    gstin: "",
    gst_type: "unregistered",

    billing_address: "",
    billing_city: "",
    billing_state: "",
    billing_pincode: "",

    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_pincode: "",

    opening_balance: 0,
    credit_limit: 0,
    notes: "",
  });

  /* ---------------- LOAD PARTY (EDIT MODE) ---------------- */
  useEffect(() => {
    if (!id) return;

    const fetchParty = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setForm({
          contact_name: data.contact_name ?? "",
          business_name: data.business_name ?? "",
          party_category: data.party_category ?? "customer",
          place_of_supply: data.place_of_supply ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          gstin: data.gstin ?? "",
          gst_type: data.gst_type ?? "unregistered",

          billing_address: data.billing_address ?? "",
          billing_city: data.city ?? "",
          billing_state: data.state ?? "",
          billing_pincode: data.pincode ?? "",

          shipping_address: data.shipping_address ?? "",
          shipping_city: "",
          shipping_state: "",
          shipping_pincode: "",

          opening_balance: data.opening_balance ?? 0,
          credit_limit: data.credit_limit ?? 0,
          notes: data.notes ?? "",
        });
      }

      setLoading(false);
      if (error) {
  console.error("Fetch party error:", error);
}

    };

    fetchParty();
  }, [id]);

  /* ---------------- HELPERS ---------------- */
  const onChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (
    type: "billing" | "shipping",
    key: "address" | "city" | "state" | "pincode",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [`${type}_${key}`]: value,
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  if (loading) return;

  const handleSubmit = async () => {
    if (!form.business_name.trim()) {
      alert("Business name is required");
      return;
    }

    setLoading(true);

    const payload = {
      name: form.business_name,

      contact_name: form.contact_name || null,
      business_name: form.business_name,
      party_category: form.party_category,
      party_type: form.party_category,
      gstin: form.gstin || null,
      gst_type: form.gst_type,
      place_of_supply: form.place_of_supply || null,
      phone: form.phone || null,
      email: form.email || null,

      billing_address: form.billing_address || null,
      shipping_address: form.shipping_address || null,
      city: form.billing_city || null,
      state: form.billing_state || null,
      pincode: form.billing_pincode || null,

      opening_balance: form.opening_balance,
      credit_limit: form.credit_limit,
      notes: form.notes || null,
      is_active: true,
    };

    const { error } = isEdit
      ? await supabase.from("parties").update([payload]).eq("id", id)
      : await supabase.from("parties").insert([payload]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard/parties");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-3">
        <h1 className="text-xl font-semibold">
          {isEdit ? "Edit Party" : "Add Party"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Home / Parties / {isEdit ? "Edit Party" : "Add Party"}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border rounded-sm p-6 space-y-6">
        {/* Names & Phone */}
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-4">
            <Label>Contact Name</Label>
            <Input
              value={form.contact_name}
              onChange={(e) => onChange("contact_name", e.target.value)}
            />
          </div>

          <div className="col-span-4">
            <Label>Business Name *</Label>
            <Input
              value={form.business_name}
              onChange={(e) => onChange("business_name", e.target.value)}
            />
          </div>

          <div className="col-span-4">
            <Label>Mobile</Label>
            <Input
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </div>
        </div>

        {/* Email & GST */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div className="col-span-4">
            <Label>GSTIN</Label>
            <Input
              value={form.gstin}
              onChange={(e) => onChange("gstin", e.target.value)}
            />
          </div>

          <div className="col-span-4">
            <Label>GST Type</Label>
            <Select
              value={form.gst_type}
              onValueChange={(v) => onChange("gst_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="unregistered">Unregistered</SelectItem>
                <SelectItem value="composition">Composition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="col-span-4">
  <Label>Party Type</Label>
  <Select
    value={form.party_category}
    onValueChange={(v) => onChange("party_category", v)}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="customer">Customer</SelectItem>
      <SelectItem value="supplier">Supplier</SelectItem>
      <SelectItem value="retail">Retail</SelectItem>
    </SelectContent>
  </Select>
</div>


        {/* Address */}
        <div className="grid grid-cols-2 gap-6">
          <AddressSection
            title="Billing"
            address={{
              address: form.billing_address,
              city: form.billing_city,
              state: form.billing_state,
              pincode: form.billing_pincode,
            }}
            onChange={(key, value) =>
              updateAddress("billing", key, value)
            }
          />

          <AddressSection
            title="Shipping"
            address={{
              address: form.shipping_address,
              city: form.shipping_city,
              state: form.shipping_state,
              pincode: form.shipping_pincode,
            }}
            onChange={(key, value) =>
              updateAddress("shipping", key, value)
            }
          />
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Party"
              : "Save Party"}
          </Button>
        </div>
      </div>
    </div>
  );
}
