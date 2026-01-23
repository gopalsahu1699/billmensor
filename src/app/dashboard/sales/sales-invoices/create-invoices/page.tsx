import { Suspense } from "react";
import CreateSalesInvoiceClient from "./CreateSalesInvoiceClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading invoice...</div>}>
      <CreateSalesInvoiceClient />
    </Suspense>
  );
}
