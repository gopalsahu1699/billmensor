import { Suspense } from "react";
import PaymentOutClient from "./PaymentOutClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Payments...</div>}>
            <PaymentOutClient />
        </Suspense>
    );
}
