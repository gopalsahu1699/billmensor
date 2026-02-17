"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronsUpDown, ArrowLeft, Plus, Trash } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

/* ================= Types ================= */
type Party = {
    id: string;
    name: string;
};

type Item = {
    id: string;
    name: string;
    stock_qty: number;
    unit: string;
    purchase_price: number;
};

type BillItem = {
    id: string;
    item_id: string;
    item_name: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
};

export default function CreatePurchaseBillClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [parties, setParties] = useState<Party[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [billNo, setBillNo] = useState("");
    const [vendorBillNo, setVendorBillNo] = useState(""); // Vendor's invoice number
    const [remarks, setRemarks] = useState("");

    // Items State
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [itemSearch, setItemSearch] = useState("");
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

    // Party Search State
    const [openParty, setOpenParty] = useState(false);

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Parties (Suppliers ideally, but fetching all for simplicity)
            const { data: partyData } = await supabase.from("parties").select("id, name").order("name");
            if (partyData) setParties(partyData);

            // 2. Fetch Items
            const { data: itemData } = await supabase.from("items").select("id, name, stock_qty, unit, purchase_price").order("name");
            if (itemData) setItems(itemData);

            // 3. Generate Bill No
            const { count } = await supabase.from("purchase_bills").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setBillNo(`PB-${String(nextNo).padStart(4, '0')}`);
        };

        init();
    }, []);

    /* ================= Item Handlers ================= */
    const addItem = (item: Item) => {
        const newItem: BillItem = {
            id: crypto.randomUUID(),
            item_id: item.id,
            item_name: item.name,
            quantity: 1,
            unit: item.unit || "PCS",
            rate: item.purchase_price || 0,
            total: item.purchase_price || 0,
        };
        setBillItems([...billItems, newItem]);
        setIsItemSearchOpen(false);
        setItemSearch("");
    };

    const updateItem = (id: string, field: keyof BillItem, value: any) => {
        setBillItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updates = { [field]: value };

            // Recalculate total if quantity or rate changes
            if (field === 'quantity' || field === 'rate') {
                const qty = field === 'quantity' ? Number(value) : item.quantity;
                const rate = field === 'rate' ? Number(value) : item.rate;
                updates.total = qty * rate;
            }

            return { ...item, ...updates };
        }));
    };

    const removeItem = (id: string) => {
        setBillItems(prev => prev.filter(item => item.id !== id));
    };

    const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);

    /* ================= Submit ================= */
    const handleSubmit = async () => {
        if (!selectedPartyId) {
            toast.error("Please select a vendor");
            return;
        }
        if (billItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Purchase Bill
            const { data: billData, error: billError } = await supabase
                .from("purchase_bills")
                .insert({
                    bill_date: format(date, "yyyy-MM-dd"),
                    party_id: selectedPartyId,
                    bill_no: billNo,
                    vendor_bill_no: vendorBillNo,
                    total_amount: totalAmount,
                    remarks: remarks,
                    status: 'Pending'
                })
                .select()
                .single();

            if (billError) throw billError;

            // 2. Create Bill Items
            const itemsToInsert = billItems.map(item => ({
                purchase_bill_id: billData.id,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                total: item.total
            }));

            const { error: itemsError } = await supabase
                .from("purchase_bill_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast.success("Purchase Bill created successfully");
            router.push("/dashboard/purchase/purchase-bills");
        } catch (err: any) {
            console.error("Error creating PB:", err);
            toast.error(err.message || "Failed to create Purchase Bill");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Create Purchase Bill</h1>
                    <p className="text-sm text-muted-foreground">Record new items purchased from vendors</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendor Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 flex flex-col">
                                <Label>Vendor Name</Label>
                                <Popover open={openParty} onOpenChange={setOpenParty}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={openParty} className="w-full justify-between">
                                            {selectedPartyId ? parties.find((p) => p.id === selectedPartyId)?.name : "Select vendor..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search vendor..." />
                                            <CommandList>
                                                <CommandEmpty>No vendor found.</CommandEmpty>
                                                <CommandGroup>
                                                    {parties.map((party) => (
                                                        <CommandItem key={party.id} value={party.name} onSelect={() => { setSelectedPartyId(party.id); setOpenParty(false); }}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedPartyId === party.id ? "opacity-100" : "opacity-0")} />
                                                            {party.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <Popover open={isItemSearchOpen} onOpenChange={setIsItemSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Search items..." value={itemSearch} onValueChange={setItemSearch} />
                                        <CommandList>
                                            <CommandEmpty>No item found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredItems.slice(0, 10).map((item) => (
                                                    <CommandItem key={item.id} value={item.name} onSelect={() => addItem(item)}>
                                                        <div className="flex flex-col">
                                                            <span>{item.name}</span>
                                                            <span className="text-xs text-muted-foreground">Price: ₹{item.purchase_price}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30%]">Item</TableHead>
                                        <TableHead className="w-[15%]">Qty</TableHead>
                                        <TableHead className="w-[20%]">Rate</TableHead>
                                        <TableHead className="w-[20%]">Total</TableHead>
                                        <TableHead className="w-[15%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {billItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.item_name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" min="1" className="h-8" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" className="h-8" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))} />
                                            </TableCell>
                                            <TableCell>₹ {item.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-destructive">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {billItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No items added.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Bill Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Bill Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Bill No (Internal)</Label>
                                <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor Bill No (Optional)</Label>
                                <Input value={vendorBillNo} onChange={(e) => setVendorBillNo(e.target.value)} placeholder="e.g. V-123" />
                            </div>
                            <div className="space-y-2">
                                <Label>Remarks</Label>
                                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Total Amount</span>
                                    <span>₹ {totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
                        {loading ? "Saving..." : "Create Bill"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
