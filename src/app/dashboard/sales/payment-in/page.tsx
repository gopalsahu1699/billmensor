import { Suspense } from "react";
import PaymentInClient from "./PaymentInClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Payment In...</div>}>
            <PaymentInClient />
        </Suspense>
    );
}
