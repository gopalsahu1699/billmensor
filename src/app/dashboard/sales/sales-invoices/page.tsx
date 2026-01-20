"use client";

import { Search, Filter, ArrowDownUp, Plus } from "lucide-react";

export default function SalesInvoicesPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Invoices</h1>
        <p className="text-sm text-gray-500">
          <span className="text-blue-600">Home</span> / Invoices
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice number, party name etc.."
            className="w-full border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">
          <Filter className="h-4 w-4" />
          Advance Filter
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">
          <ArrowDownUp className="h-4 w-4" />
          Date Added Descending
        </button>

        <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Create New invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="bg-white border rounded-md mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <div className="p-4 border-b sm:border-b-0 sm:border-r">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-lg font-semibold">₹ 0</p>
          </div>
          <div className="p-4 border-b sm:border-b-0 sm:border-r">
            <p className="text-sm text-gray-500">Unpaid</p>
            <p className="text-lg font-semibold">₹ 0</p>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-lg font-semibold">₹ 0</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 border-b">Date</th>
              <th className="text-left px-4 py-3 border-b">Invoice No.</th>
              <th className="text-left px-4 py-3 border-b">Party Name</th>
              <th className="text-right px-4 py-3 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="text-center py-6 text-gray-500"
              >
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-2 text-sm font-medium">
        Total 0 records
      </div>
    </div>
  );
}
