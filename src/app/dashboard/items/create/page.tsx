import { Suspense } from "react";
import CreateItemClient from "./CreateItemClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading item...</div>}>
      <CreateItemClient />
    </Suspense>
  );
}
