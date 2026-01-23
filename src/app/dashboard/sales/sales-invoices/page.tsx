import { Suspense } from "react";
import SalesInvoicesClient from "./SalesInvoicesClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading invoices...</div>}>
      <SalesInvoicesClient />
    </Suspense>
  );
}
