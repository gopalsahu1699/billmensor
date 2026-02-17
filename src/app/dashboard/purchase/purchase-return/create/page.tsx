import { Suspense } from "react";
import CreatePurchaseReturnClient from "./CreatePurchaseReturnClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreatePurchaseReturnClient />
        </Suspense>
    );
}
