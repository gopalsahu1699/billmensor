"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Plus, Trash2 } from "lucide-react";

export default function CompanySettingsPage() {
  type CompanySettings = {
  id?: string;

  company_name: string;
  designation: string;
  company_website: string;
  business_type: string;
  industry_type: string;
  phone_number: string;
  billing_address: string;
  place_of_supply: string;
  upi_id: string;
  terms_and_conditions: string;

  // 👇 ADD THESE
  logo_url?: string | null;
  signature_url?: string | null;
};

  /* ---------------- STATE ---------------- */

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState<CompanySettings>({
  company_name: "",
  designation: "",
  company_website: "",
  business_type: "",
  industry_type: "",
  phone_number: "",
  billing_address: "",
  place_of_supply: "",
  upi_id: "",
  terms_and_conditions: "",
  logo_url: null,
  signature_url: null,
});


  const [bank, setBank] = useState({
    account_number: "",
    account_holder_name: "",
    ifsc_code: "",
    bank_branch_name: "",
  });

  const [ids, setIds] = useState<
    { id_type: string; id_value: string; show_on_invoice: boolean }[]
  >([]);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    fetchCompanyData();
  }, []);

  async function fetchCompanyData() {
    setLoading(true);

    const { data: companyData } = await supabase
      .from("company_settings")
      .select("*")
      .single();

    if (companyData) {
      setCompany(companyData);
      setCompanyId(companyData.id);

      const { data: bankData } = await supabase
        .from("company_bank_details")
        .select("*")
        .eq("company_id", companyData.id)
        .single();

      if (bankData) setBank(bankData);

      const { data: idData } = await supabase
        .from("company_identification_numbers")
        .select("*")
        .eq("company_id", companyData.id);

      if (idData) setIds(idData);
    }

    setLoading(false);
  }
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
}

async function handleLogoUpload(file: File) {
  const url = await uploadToCloudinary(file);
  setCompany((prev) => ({ ...prev, logo_url: url }));

  if (companyId) {
    await supabase
      .from("company_settings")
      .update({ logo_url: url })
      .eq("id", companyId);
  }
}

async function handleSignatureUpload(file: File) {
  const url = await uploadToCloudinary(file);
  setCompany((prev) => ({ ...prev, signature_url: url }));

  if (companyId) {
    await supabase
      .from("company_settings")
      .update({ signature_url: url })
      .eq("id", companyId);
  }
}


async function handleSave() {
  try {
    setLoading(true);

    if (!companyId) {
      // INSERT
      const { data, error } = await supabase
        .from("company_settings")
        .insert(company)
        .select()
        .single();

      if (error) throw error;

      setCompanyId(data.id);
    } else {
      // UPDATE
      const { error } = await supabase
        .from("company_settings")
        .update(company)
        .eq("id", companyId);

      if (error) throw error;
    }

    alert("Company settings saved successfully");
  } catch (err) {
    console.error(err);
    alert("Failed to save company settings");
  } finally {
    setLoading(false);
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
      <img
        src={company.logo_url}
        alt="Logo"
        className="w-full h-full object-contain"
      />
    ) : (
      <>
        <Upload className="w-6 h-6 mb-2" />
        Upload Logo
      </>
    )}
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleLogoUpload(e.target.files[0]);
        }
      }}
    />
  </label>

  {/* SIGNATURE */}
  <label className="w-32 h-32 bg-muted rounded-xl flex flex-col items-center justify-center text-sm cursor-pointer overflow-hidden">
    {company.signature_url ? (
      <img
        src={company.signature_url}
        alt="Signature"
        className="w-full h-full object-contain"
      />
    ) : (
      <>
        <Upload className="w-6 h-6 mb-2" />
        Upload Signature
      </>
    )}
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleSignatureUpload(e.target.files[0]);
        }
      }}
    />
  </label>
</div>


              <Input
                placeholder="Company Name"
                value={company.company_name}
                onChange={(e) =>
                  setCompany({ ...company, company_name: e.target.value })
                }
              />

              <Select
                value={company.designation}
                onValueChange={(v) =>
                  setCompany({ ...company, designation: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Company Website"
                value={company.company_website}
                onChange={(e) =>
                  setCompany({ ...company, company_website: e.target.value })
                }
              />

              <Select
                value={company.business_type}
                onValueChange={(v) =>
                  setCompany({ ...company, business_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietor">Proprietor</SelectItem>
                  <SelectItem value="pvt">Private Limited</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Phone Number"
                value={company.phone_number}
                onChange={(e) =>
                  setCompany({ ...company, phone_number: e.target.value })
                }
              />

              <Select
                value={company.industry_type}
                onValueChange={(v) =>
                  setCompany({ ...company, industry_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Industry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                className="md:col-span-2"
                placeholder="Billing Address"
                value={company.billing_address}
                onChange={(e) =>
                  setCompany({ ...company, billing_address: e.target.value })
                }
              />

              <Select
                value={company.place_of_supply}
                onValueChange={(v) =>
                  setCompany({ ...company, place_of_supply: v })
                }
              >
                <SelectTrigger className="md:col-span-2">
                  <SelectValue placeholder="Place of Supply" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 - Gujarat</SelectItem>
                  <SelectItem value="27">27 - Maharashtra</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Business Identification Numbers (UI unchanged) */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Business Identification Numbers</CardTitle>
              <Button size="icon" variant="outline">
                <Plus />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="CIN / GSTIN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cin">CIN</SelectItem>
                    <SelectItem value="gst">GSTIN</SelectItem>
                  </SelectContent>
                </Select>

                <Input placeholder="Enter Number" />

                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Show on Invoice</span>
                </div>

                <Button size="icon" variant="destructive">
                  <Trash2 />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SECTION */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Details</CardTitle>
              <Button variant="link">Edit Bank Details</Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                className="md:col-span-2"
                placeholder="Account Number"
                value={bank.account_number}
                onChange={(e) =>
                  setBank({ ...bank, account_number: e.target.value })
                }
              />
              <Input
                placeholder="Account Holder's Name"
                value={bank.account_holder_name}
                onChange={(e) =>
                  setBank({
                    ...bank,
                    account_holder_name: e.target.value,
                  })
                }
              />
              <Input
                placeholder="IFSC Code"
                value={bank.ifsc_code}
                onChange={(e) =>
                  setBank({ ...bank, ifsc_code: e.target.value })
                }
              />
              <Input
                className="md:col-span-2"
                placeholder="Bank & Branch Name"
                value={bank.bank_branch_name}
                onChange={(e) =>
                  setBank({
                    ...bank,
                    bank_branch_name: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>UPI Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter UPI ID"
                value={company.upi_id}
                onChange={(e) =>
                  setCompany({ ...company, upi_id: e.target.value })
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter terms and conditions"
                rows={5}
                value={company.terms_and_conditions}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    terms_and_conditions: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="lg" disabled={loading} onClick={handleSave}>
  {loading ? "Saving..." : "Save Changes"}
</Button>

      </div>
    </div>
  );
}
