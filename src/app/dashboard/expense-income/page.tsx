"use client";

import { Search, Plus } from "lucide-react";

export default function ExpenseIncomePage() {
  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold">Khata Billing</h1>
          <p className="text-xs text-gray-400">FREE PLAN</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
          {["Dashboard", "Parties", "Items", "Category", "Sales", "Purchase", "Expense & Income", "Reports", "Settings", "Online Orders", "Point of Sale (POS)"]
            .map((item) => (
              <div
                key={item}
                className={`px-4 py-2 rounded cursor-pointer ${item === "Expense & Income" ? "bg-sky-600 text-white" : "hover:bg-white/10"}`}
              >
                {item}
              </div>
            ))}
        </nav>

        <div className="px-4 py-4 text-xs text-gray-400 border-t border-white/10">
          <p>100% Secure • Made in India</p>
          <button className="mt-3 w-full bg-white/10 py-2 rounded">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Expense & Income</h2>
          <p className="text-sm text-gray-500">Home / Expense & Income</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search expenses"
              className="w-full pl-10 pr-4 py-2 border rounded bg-white"
            />
          </div>

          <button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded">
            <Plus size={18} /> Create Expense & Income
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["ID", "Date", "Category", "Items", "Quantity", "Notes", "Payment Mode", "Amount"].map((head) => (
                  <th key={head} className="text-left px-4 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No data available in table
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-right text-sm text-gray-600">
          Total 0 records
        </div>

        {/* Footer */}
        <footer className="mt-10 text-xs text-gray-500 flex gap-4 flex-wrap">
          <span>Learn more about Khata Billing</span>
          <span>Privacy Policy</span>
          <span>Terms & Conditions</span>
          <span>Cancellation and Refund</span>
          <span>How to Use</span>
        </footer>
      </main>
    </div>
  );
}
