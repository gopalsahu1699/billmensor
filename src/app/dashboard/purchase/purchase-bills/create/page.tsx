import { Suspense } from "react";
import CreatePurchaseBillClient from "./CreatePurchaseBillClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreatePurchaseBillClient />
        </Suspense>
    );
}
