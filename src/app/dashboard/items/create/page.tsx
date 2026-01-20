"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function CreateItemPage() {
  const router = useRouter();
const searchParams = useSearchParams();
const itemId = searchParams.get("id");
useEffect(() => {
  if (!itemId) return;

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setForm({
      item_type: data.item_type,
      item_name: data.name,
      description: data.description || "",
      category_id: data.category_id || "",
      unit: data.unit,
      opening_stock: data.opening_stock,
      stock_qty: data.stock_qty,
      selling_price: data.selling_price,
      purchase_price: data.purchase_price,
      mrp: data.mrp,
      hsn_sac: data.hsn_sac || "",
      gst_rate: data.gst_rate,
      wholesale_price: data.wholesale_price,
    
      image_url: data.image_url || "",
    });
  };

  fetchItem();
}, [itemId]);

  /* ---------------- STATE ---------------- */
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState({
    item_type: "product",
    item_name: "",
   
    description: "",
    category_id: "",
    unit: "PCS",
    opening_stock: 0,
    stock_qty: 0,
    selling_price: 0,
    purchase_price: 0,
    mrp: 0,
    hsn_sac: "",
    gst_rate: 0,
    wholesale_price: 0,
  
    image_url: "",
  });

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    setCategories(data || []);
  };

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  /* ---------------- IMAGE UPLOAD ---------------- */
  const uploadImage = async (file: File) => {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    setUploading(false);

    if (!data.secure_url) {
      alert("Image upload failed");
      return;
    }

    setForm((prev) => ({ ...prev, image_url: data.secure_url }));
  };

  /* ---------------- SUBMIT ---------------- */
 const handleSubmit = async () => {
  if (!form.item_name.trim()) {
    alert("Item name is required");
    return;
  }

  setLoading(true);

  const payload = {
    name: form.item_name.trim(),
    hsn_sac: form.hsn_sac.trim() || `ITEM-${Date.now()}`,
    item_type: form.item_type,
    description: form.description,
    category_id: form.category_id || null,
    unit: form.unit,
    
    stock_qty: form.opening_stock,
    selling_price: form.selling_price,
    purchase_price: form.purchase_price,
    mrp: form.mrp,
 
    gst_rate: form.gst_rate,
    wholesale_price: form.wholesale_price,
   
    image_url: form.image_url,
  };

  const { error } = itemId
    ? await supabase.from("items").update(payload).eq("id", itemId)
    : await supabase.from("items").insert([payload]);

  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  router.push("/dashboard/items");
};


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Item</h1>
          <p className="text-sm text-muted-foreground">
            Home / Items / Create Item
          </p>
        </div>

        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/items")}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Data"}
          </Button>
        </div>
      </div>

      {/* GENERAL + STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GENERAL DETAILS */}
        <Card className="p-4 space-y-4">
          <h2 className="font-medium text-blue-700">General Details</h2>

          {/* IMAGE */}
          <div>
            <p className="font-medium mb-2">Item Image</p>

            {form.image_url ? (
              <img
                src={form.image_url}
                alt="Item"
                className="h-32 w-32 object-cover rounded border mb-2"
              />
            ) : (
              <div className="h-32 w-32 flex items-center justify-center border rounded text-sm text-muted-foreground mb-2">
                No Image
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) =>
                e.target.files && uploadImage(e.target.files[0])
              }
            />

            {uploading && (
              <p className="text-xs text-muted-foreground mt-1">
                Uploading image...
              </p>
            )}
          </div>

          {/* ITEM TYPE */}
          <div>
            <p className="font-medium">Item Type</p>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="item_type"
                  checked={form.item_type === "product"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      item_type: "product",
                    }))
                  }
                />
                Product
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="item_type"
                  checked={form.item_type === "service"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      item_type: "service",
                    }))
                  }
                />
                Service
              </label>
            </div>
          </div>

          <div>
            <p className="font-medium">Item Name</p>
            <Input
              name="item_name"
              value={form.item_name}
              onChange={handleChange}
              placeholder="Enter Item Name"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <p className="font-medium mb-1">Item Category</p>

            <div className="flex gap-2">
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category_id: e.target.value,
                  }))
                }
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCategoryModal(true)}
              >
                + Add
              </Button>
            </div>
          </div>

          {/* CATEGORY MODAL */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <Card className="w-full max-w-sm p-4 space-y-4">
                <h3 className="text-lg font-semibold">Create Category</h3>

                <Input
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={async () => {
                      if (!newCategory.trim()) return;

                      const { data } = await supabase
                        .from("categories")
                        .insert([{ name: newCategory.trim() }])
                        .select()
                        .single();

                      if (data) {
                        setCategories((prev) => [...prev, data]);
                        setForm((prev) => ({
                          ...prev,
                          category_id: data.id,
                        }));
                        setNewCategory("");
                        setShowCategoryModal(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </Card>
            </div>
          )}

          <div>
            <p className="font-medium">HSN/SAC</p>
            <Input
              name="hsn_sac"
              value={form.hsn_sac}
              onChange={handleChange}
              placeholder="Enter hsn_sac"
            />
          </div>

          <div>
            <p className="font-medium">Item Description</p>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Remaining characters: {255 - form.description.length}
            </p>
          </div>
        </Card>

        {/* STOCK DETAILS */}
        <Card className="p-4 space-y-4">
          <h2 className="font-medium text-blue-700">Stock Details</h2>

          <div>
            <p className="font-medium">Unit</p>
            <Input
              name="unit"
              value={form.unit}
              onChange={handleChange}
            />
          </div>

          <div>
            <p className="font-medium">Opening Stock</p>
            <Input
              type="number"
              name="opening_stock"
              value={form.opening_stock}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-8">
            <div>
              <p className="font-medium">Available Stock</p>
              <p>{form.opening_stock}</p>
            </div>
            <div>
              <p className="font-medium">Current Stock</p>
              <p>{form.opening_stock}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* PRICING DETAILS */}
      <Card className="p-4 space-y-6">
        <h2 className="font-medium text-blue-700">Pricing Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
          <p className="font-medium">MRP (display purpose only)</p>
          <Input
            type="number"
            name="mrp"
            value={form.mrp}
            onChange={handleChange}
          />
        </div>
          <div>
            <p className="font-medium">Purchase Price (per quantity)</p>
            <Input
              type="number"
              name="purchase_price"
              value={form.purchase_price}
              onChange={handleChange}
            />
          </div>
          <div>
            <p className="font-medium">Sales Price (per quantity)</p>
            <Input
              type="number"
              name="selling_price"
              value={form.selling_price}
              onChange={handleChange}
            />
          </div>
          <div>
            <p className="font-medium">WholeSale Price(per quantity)</p>
            <Input
              type="number"
              name="wholesale_price"
              value={form.wholesale_price}
              onChange={handleChange}
            />
          </div>

        
        </div>

       

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
          <div>
            <p className="font-medium">GST Tax Rate (%)</p>
            <select
              value={String(form.gst_rate)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gst_rate: Number(e.target.value),
                }))
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="0">0% (Nil / Exempt)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
        </div>    
      </Card>
    </div>
  );
}
