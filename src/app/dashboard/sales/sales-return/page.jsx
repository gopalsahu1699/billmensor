"use client";

import { Search, Plus } from "lucide-react";

export default function SalesReturnPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Sales Return</h1>
        <p className="text-sm text-gray-500">
          <span className="text-blue-600">Home</span> / Sales Return
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Sales Return"
            className="w-full border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Create New Sales Return
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 border-b">Date</th>
              <th className="text-left px-4 py-3 border-b">Sale Return Number</th>
              <th className="text-left px-4 py-3 border-b">Party Name</th>
              <th className="text-right px-4 py-3 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500">
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
