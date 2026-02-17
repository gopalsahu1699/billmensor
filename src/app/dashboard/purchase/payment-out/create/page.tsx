import { Suspense } from "react";
import CreatePaymentOutClient from "./CreatePaymentOutClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreatePaymentOutClient />
        </Suspense>
    );
}
