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

type Party = { id: string; name: string; };
type Item = { id: string; name: string; purchase_price: number; unit: string; };
type ReturnItem = { id: string; item_id: string; item_name: string; quantity: number; unit: string; rate: number; total: number; reason: string; };

export default function CreatePurchaseReturnClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [parties, setParties] = useState<Party[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [returnNo, setReturnNo] = useState("");
    const [remarks, setRemarks] = useState("");

    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [itemSearch, setItemSearch] = useState("");
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);
    const [openParty, setOpenParty] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: partyData } = await supabase.from("parties").select("id, name").order("name");
            if (partyData) setParties(partyData);

            const { data: itemData } = await supabase.from("items").select("id, name, unit, purchase_price").order("name");
            if (itemData) setItems(itemData);

            const { count } = await supabase.from("purchase_returns").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setReturnNo(`PR-${String(nextNo).padStart(4, '0')}`);
        };
        init();
    }, []);

    const addItem = (item: Item) => {
        const newItem: ReturnItem = {
            id: crypto.randomUUID(),
            item_id: item.id,
            item_name: item.name,
            quantity: 1,
            unit: item.unit || "PCS",
            rate: item.purchase_price || 0,
            total: item.purchase_price || 0,
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

    const handleSubmit = async () => {
        if (!selectedPartyId) return toast.error("Select a vendor");
        if (!returnItems.length) return toast.error("Add items");

        setLoading(true);
        try {
            const { data: returnData, error: returnError } = await supabase
                .from("purchase_returns")
                .insert({
                    return_date: format(date, "yyyy-MM-dd"),
                    party_id: selectedPartyId,
                    return_no: returnNo,
                    total_amount: totalAmount,
                    remarks,
                    status: 'Pending'
                })
                .select()
                .single();

            if (returnError) throw returnError;

            const itemsToInsert = returnItems.map(item => ({
                purchase_return_id: returnData.id,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                total: item.total,
                reason: item.reason
            }));

            const { error: itemsError } = await supabase.from("purchase_return_items").insert(itemsToInsert);
            if (itemsError) throw itemsError;

            toast.success("Purchase Return created");
            router.push("/dashboard/purchase/purchase-return");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to create return");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <h1 className="text-2xl font-semibold">Create Purchase Return</h1>
                    <p className="text-sm text-muted-foreground">Return items to vendor</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Vendor</CardTitle></CardHeader>
                        <CardContent>
                            <Popover open={openParty} onOpenChange={setOpenParty}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPartyId ? parties.find((p) => p.id === selectedPartyId)?.name : "Select vendor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <Popover open={isItemSearchOpen} onOpenChange={setIsItemSearchOpen}>
                                <PopoverTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Item</Button></PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Search..." value={itemSearch} onValueChange={setItemSearch} />
                                        <CommandList>
                                            <CommandGroup>
                                                {filteredItems.slice(0, 10).map((item) => (
                                                    <CommandItem key={item.id} value={item.name} onSelect={() => addItem(item)}>
                                                        <span>{item.name}</span>
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
                                    <TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.item_name}</div>
                                                <Input placeholder="Reason" className="h-7 text-xs mt-1" value={item.reason} onChange={(e) => updateItem(item.id, 'reason', e.target.value)} />
                                            </TableCell>
                                            <TableCell><Input type="number" className="h-8 w-20" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} /></TableCell>
                                            <TableCell><Input type="number" className="h-8 w-24" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} /></TableCell>
                                            <TableCell>₹ {item.total.toFixed(2)}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash className="h-4 w-4 text-destructive" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                    {!returnItems.length && <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No items.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus /></PopoverContent></Popover></div>
                            <div className="space-y-2"><Label>Return No</Label><Input value={returnNo} onChange={(e) => setReturnNo(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
                            <div className="pt-4 border-t flex justify-between font-bold text-lg"><span>Total</span><span>₹ {totalAmount.toFixed(2)}</span></div>
                        </CardContent>
                    </Card>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">{loading ? "Saving..." : "Create Return"}</Button>
                </div>
            </div>
        </div>
    );
}
