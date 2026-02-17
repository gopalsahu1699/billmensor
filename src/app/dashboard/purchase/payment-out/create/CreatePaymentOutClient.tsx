"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Party = { id: string; name: string; };

export default function CreatePaymentOutClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parties, setParties] = useState<Party[]>([]);

    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [paymentNo, setPaymentNo] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [referenceNo, setReferenceNo] = useState("");
    const [remarks, setRemarks] = useState("");
    const [openParty, setOpenParty] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: partyData } = await supabase.from("parties").select("id, name").order("name");
            if (partyData) setParties(partyData);

            const { count } = await supabase.from("payment_out").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setPaymentNo(`PO-${String(nextNo).padStart(4, '0')}`);
        };
        init();
    }, []);

    const handleSubmit = async () => {
        if (!selectedPartyId) return toast.error("Select vendor");
        if (!amount || Number(amount) <= 0) return toast.error("Enter valid amount");

        setLoading(true);
        try {
            const { error } = await supabase.from("payment_out").insert({
                payment_date: format(date, "yyyy-MM-dd"),
                party_id: selectedPartyId,
                payment_no: paymentNo,
                amount: Number(amount),
                payment_mode: paymentMode,
                reference_no: referenceNo,
                remarks: remarks,
            });

            if (error) throw error;

            toast.success("Payment saved successfully");
            router.push("/dashboard/purchase/payment-out");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <h1 className="text-2xl font-semibold">Record Payment Out</h1>
                    <p className="text-sm text-muted-foreground">Record payment to vendor</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2"><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus /></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>Payment No</Label><Input value={paymentNo} onChange={(e) => setPaymentNo(e.target.value)} /></div>
                        <div className="space-y-2 flex flex-col"><Label>Vendor Name</Label><Popover open={openParty} onOpenChange={setOpenParty}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between">{selectedPartyId ? parties.find((p) => p.id === selectedPartyId)?.name : "Select vendor..."}<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[300px] p-0"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No vendor found.</CommandEmpty><CommandGroup>{parties.map((party) => (<CommandItem key={party.id} value={party.name} onSelect={() => { setSelectedPartyId(party.id); setOpenParty(false); }}><Check className={cn("mr-2 h-4 w-4", selectedPartyId === party.id ? "opacity-100" : "opacity-0")} />{party.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2"><Label>Timed Amount (₹)</Label><Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-semibold" /></div>
                        <div className="space-y-2"><Label>Mode</Label><Select value={paymentMode} onValueChange={setPaymentMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cheque">Cheque</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Reference No / Trans ID</Label><Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" /></div>
                        <div className="space-y-2"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">{loading ? "Saving..." : "Save Payment"}</Button>
            </div>
        </div>
    );
}
