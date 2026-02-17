import { Suspense } from "react";
import CreatePaymentInClient from "./CreatePaymentInClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreatePaymentInClient />
        </Suspense>
    );
}
