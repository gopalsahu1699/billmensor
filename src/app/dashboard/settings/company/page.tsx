"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function CompanySettingsPage() {
  type CompanySettings = {
    id?: string;
    company_name: string;
    designation: string;
    company_website: string;
    business_type: string;
    industry_type: string;
    phone_number: string;
    email_id: string;
    gst_value: string;
    company_address: string;
    place_of_supply: string;
    terms_and_conditions: string;
    logo_url?: string | null;
    signature_url?: string | null;
  };

  /* ---------------- STATE ---------------- */
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);

  const [company, setCompany] = useState<CompanySettings>({
    company_name: "",
    designation: "",
    company_website: "",
    business_type: "",
    industry_type: "",
    phone_number: "",
    email_id: "",
    gst_value: "",
    company_address: "",
    place_of_supply: "",
    terms_and_conditions: "",
    logo_url: null,
    signature_url: null,
  });

  const [bank, setBank] = useState({
    account_number: "",
    account_holder_name: "",
    ifsc_code: "",
    bank_branch_name: "",
    upi_id: "",
  });

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    fetchCompanyData();
  }, []);

  async function fetchCompanyData() {
    setLoading(true);
    const { data: companyData } = await supabase.from("company_settings").select("*").single();

    if (companyData) {
      setCompany({
        company_name: companyData.company_name ?? "",
        designation: companyData.designation ?? "",
        company_website: companyData.company_website ?? "",
        business_type: companyData.business_type ?? "",
        industry_type: companyData.industry_type ?? "",
        phone_number: companyData.phone_number ?? "",
        email_id: companyData.email_id ?? "",
        gst_value: companyData.gst_value ?? "",
        company_address: companyData.company_address ?? "",
        place_of_supply: companyData.place_of_supply ?? "",
        terms_and_conditions: companyData.terms_and_conditions ?? "",
        logo_url: companyData.logo_url ?? null,
        signature_url: companyData.signature_url ?? null,
      });
      setCompanyId(companyData.id);

      const { data: bankData } = await supabase
        .from("company_bank_details")
        .select("*")
        .eq("company_id", companyData.id)
        .single();

      if (bankData) {
        setBank({
          account_number: bankData.account_number ?? "",
          account_holder_name: bankData.account_holder_name ?? "",
          ifsc_code: bankData.ifsc_code ?? "",
          bank_branch_name: bankData.bank_branch_name ?? "",
          upi_id: bankData.upi_id ?? "",
        });
      }
    }

    setLoading(false);
  }

  /* ---------------- CLOUDINARY UPLOAD ---------------- */
  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  }

  async function handleLogoUpload(file: File) {
    const url = await uploadToCloudinary(file);
    setCompany((prev) => ({ ...prev, logo_url: url }));
    if (companyId) await supabase.from("company_settings").update({ logo_url: url }).eq("id", companyId);
  }

  async function handleSignatureUpload(file: File) {
    const url = await uploadToCloudinary(file);
    setCompany((prev) => ({ ...prev, signature_url: url }));
    if (companyId) await supabase.from("company_settings").update({ signature_url: url }).eq("id", companyId);
  }

  /* ---------------- SAVE FUNCTIONS ---------------- */
  async function handleSave() {
    try {
      setLoading(true);
      if (!companyId) {
        const { data, error } = await supabase.from("company_settings").insert(company).select().single();
        if (error) throw error;
        setCompanyId(data.id);
      } else {
        const { error } = await supabase.from("company_settings").update(company).eq("id", companyId);
        if (error) throw error;
      }
      toast.success("Company settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save company settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleBankSave() {
    if (!companyId) return toast.error("Please save company details first");
    try {
      setBankLoading(true);
      const { data: existingBank } = await supabase
        .from("company_bank_details")
        .select("id")
        .eq("company_id", companyId)
        .single();

      if (existingBank) {
        const { error } = await supabase
          .from("company_bank_details")
          .update(bank)
          .eq("company_id", companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_bank_details")
          .insert({ ...bank, company_id: companyId });
        if (error) throw error;
      }

      toast.success("Bank details saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save bank details");
    } finally {
      setBankLoading(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Company Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SECTION */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex gap-6">
                {/* LOGO */}
                <label className="w-32 h-32 bg-muted rounded-xl flex flex-col items-center justify-center text-sm cursor-pointer overflow-hidden">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2" /> Upload Logo
                    </>
                  )}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                </label>

                {/* SIGNATURE */}
                <label className="w-32 h-32 bg-muted rounded-xl flex flex-col items-center justify-center text-sm cursor-pointer overflow-hidden">
                  {company.signature_url ? (
                    <img src={company.signature_url} alt="Signature" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2" /> Upload Signature
                    </>
                  )}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleSignatureUpload(e.target.files[0])} />
                </label>
              </div>

              <Input placeholder="Company Name" value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
              <Select value={company.designation || undefined} onValueChange={(v) => setCompany({ ...company, designation: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Company Website" value={company.company_website} onChange={(e) => setCompany({ ...company, company_website: e.target.value })} />
              <Select value={company.business_type || undefined} onValueChange={(v) => setCompany({ ...company, business_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietor">Proprietor</SelectItem>
                  <SelectItem value="pvt">Private Limited</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Phone Number" value={company.phone_number} onChange={(e) => setCompany({ ...company, phone_number: e.target.value })} />
              <Select value={company.industry_type} onValueChange={(v) => setCompany({ ...company, industry_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Industry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Email ID" value={company.email_id} onChange={(e) => setCompany({ ...company, email_id: e.target.value })} />
              <Select value={company.place_of_supply || undefined} onValueChange={(v) => setCompany({ ...company, place_of_supply: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Place of Supply" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 - Chhattisgarh</SelectItem>
                  <SelectItem value="24">24 - Gujarat</SelectItem>
                  <SelectItem value="27">27 - Maharashtra</SelectItem>
                </SelectContent>
              </Select>
              <Textarea className="md:col-span-2" placeholder="Company Address" value={company.company_address} onChange={(e) => setCompany({ ...company, company_address: e.target.value })} />
            </CardContent>
          </Card>

          {/* GST Number */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>GST Number</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Enter GST Number" value={company.gst_value} onChange={(e) => setCompany({ ...company, gst_value: e.target.value })} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SECTION */}
        <div className="space-y-6">
          {/* Bank Details */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input className="md:col-span-2" placeholder="Account Number" value={bank.account_number} disabled={!companyId} onChange={(e) => setBank({ ...bank, account_number: e.target.value })} />
              <Input placeholder="Account Holder's Name" value={bank.account_holder_name} onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })} />
              <Input placeholder="IFSC Code" value={bank.ifsc_code} onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value })} />
              <Input className="md:col-span-2" placeholder="Bank & Branch Name" value={bank.bank_branch_name} onChange={(e) => setBank({ ...bank, bank_branch_name: e.target.value })} />
            </CardContent>
          </Card>

          {/* UPI */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>UPI Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Enter UPI ID" value={bank.upi_id} disabled={!companyId} onChange={(e) => setBank({ ...bank, upi_id: e.target.value })} />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleBankSave} disabled={bankLoading || !companyId}>
                  {bankLoading ? "Saving..." : "Save UPI"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={5} placeholder="Enter terms and conditions" value={company.terms_and_conditions} onChange={(e) => setCompany({ ...company, terms_and_conditions: e.target.value })} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
