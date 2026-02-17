import { Suspense } from "react";
import PurchaseReturnClient from "./PurchaseReturnClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Purchase Returns...</div>}>
            <PurchaseReturnClient />
        </Suspense>
    );
}
