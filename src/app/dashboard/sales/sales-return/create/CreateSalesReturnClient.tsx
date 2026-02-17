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
    selling_price: number;
};

type ReturnItem = {
    id: string;
    item_id: string;
    item_name: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
    reason: string;
};

export default function CreateSalesReturnClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [parties, setParties] = useState<Party[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [returnNo, setReturnNo] = useState("");
    const [remarks, setRemarks] = useState("");

    // Items State
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [itemSearch, setItemSearch] = useState("");
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

    // Party Search State
    const [openParty, setOpenParty] = useState(false);

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Parties
            const { data: partyData } = await supabase.from("parties").select("id, name").order("name");
            if (partyData) setParties(partyData);

            // 2. Fetch Items
            const { data: itemData } = await supabase.from("items").select("id, name, stock_qty, unit, selling_price").order("name");
            if (itemData) setItems(itemData);

            // 3. Generate Return No
            const { count } = await supabase.from("sales_returns").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setReturnNo(`SR-${String(nextNo).padStart(4, '0')}`);
        };

        init();
    }, []);

    /* ================= Item Handlers ================= */
    const addItem = (item: Item) => {
        const newItem: ReturnItem = {
            id: crypto.randomUUID(),
            item_id: item.id,
            item_name: item.name,
            quantity: 1,
            unit: item.unit || "PCS",
            rate: item.selling_price || 0,
            total: item.selling_price || 0,
            reason: "",
        };
        setReturnItems([...returnItems, newItem]);
        setIsItemSearchOpen(false);
        setItemSearch("");
    };

    const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
        setReturnItems(prev => prev.map(item => {
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
        setReturnItems(prev => prev.filter(item => item.id !== id));
    };

    const totalAmount = returnItems.reduce((sum, item) => sum + item.total, 0);

    /* ================= Submit ================= */
    const handleSubmit = async () => {
        if (!selectedPartyId) {
            toast.error("Please select a party");
            return;
        }
        if (returnItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Sales Return
            const { data: returnData, error: returnError } = await supabase
                .from("sales_returns")
                .insert({
                    return_date: format(date, "yyyy-MM-dd"),
                    party_id: selectedPartyId,
                    return_no: returnNo,
                    total_amount: totalAmount,
                    remarks: remarks,
                    status: 'Pending'
                })
                .select()
                .single();

            if (returnError) throw returnError;

            // 2. Create Return Items
            const itemsToInsert = returnItems.map(item => ({
                sales_return_id: returnData.id,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                total: item.total,
                reason: item.reason
            }));

            const { error: itemsError } = await supabase
                .from("sales_return_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast.success("Sales Return created successfully");
            router.push("/dashboard/sales/sales-return");
        } catch (err: any) {
            console.error("Error creating SR:", err);
            toast.error(err.message || "Failed to create Sales Return");
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
                    <h1 className="text-2xl font-semibold tracking-tight">Create Sales Return</h1>
                    <p className="text-sm text-muted-foreground">Record goods returned by customers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Party Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 flex flex-col">
                                <Label>Party Name</Label>
                                <Popover open={openParty} onOpenChange={setOpenParty}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={openParty} className="w-full justify-between">
                                            {selectedPartyId ? parties.find((p) => p.id === selectedPartyId)?.name : "Select party..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search party..." />
                                            <CommandList>
                                                <CommandEmpty>No party found.</CommandEmpty>
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
                                                            <span className="text-xs text-muted-foreground">Price: ₹{item.selling_price}</span>
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
                                    {returnItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.item_name}</div>
                                                <Input
                                                    placeholder="Reason"
                                                    className="h-7 text-xs mt-1"
                                                    value={item.reason}
                                                    onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                                                />
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
                                    {returnItems.length === 0 && (
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
                        <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Return Date</Label>
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
                                <Label>Return No</Label>
                                <Input value={returnNo} onChange={(e) => setReturnNo(e.target.value)} />
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
                        {loading ? "Saving..." : "Create Return"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
