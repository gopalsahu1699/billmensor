import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Last 30 Days</p>
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          "Create Party",
          "Create Sale",
          "Create Quotation",
          "Create Item",
          "Create Expense",
          "Create Purchase",
        ].map((label) => (
          <Button key={label} variant="outline" className="text-sm">
            {label}
          </Button>
        ))}
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Sale"
          bg="bg-green-600"
          stats={[
            { label: "Total Sale", value: "₹0" },
            { label: "Paid", value: "₹0" },
            { label: "Unpaid", value: "₹0" },
          ]}
        />

        <DashboardCard
          title="Purchase"
          bg="bg-blue-600"
          stats={[
            { label: "Total Purchase", value: "₹0" },
            { label: "Paid", value: "₹0" },
            { label: "Unpaid", value: "₹0" },
          ]}
        />

        <ReturnCard title="Sale Return" bg="bg-slate-500" />
        <ReturnCard title="Purchase Return" bg="bg-red-600" />
      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-white p-5 shadow-sm border">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            30-Day Sales Trend
          </h2>
          <div className="h-48 rounded-md bg-gray-100" />
        </div>

        <aside className="space-y-3">
          <SmallCard title="Total Expense" value="₹0" />
          <SmallCard title="Expense Balance" value="₹0" />
          <SmallCard title="Item" value="1" />
          <SmallCard title="Party" value="1" />
        </aside>
      </div>
    </section>
  );
}

/* ----- Components ----- */

function DashboardCard({
  title,
  bg,
  stats,
}: {
  title: string;
  bg: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className={`${bg} text-white rounded-lg p-4 shadow-md`}>
      <h3 className="font-medium">{title}</h3>
      <p className="text-2xl font-semibold">₹0</p>

      {stats && (
        <div className="mt-2 space-y-1 text-sm opacity-90">
          {stats.map((s) => (
            <div key={s.label} className="flex justify-between">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReturnCard({
  title,
  bg,
}: {
  title: string;
  bg: string;
}) {
  return (
    <div
      className={`${bg} text-white rounded-lg p-4 shadow-md relative overflow-hidden`}
    >
      {/* Background faint icon placeholder */}
      <div className="absolute inset-0 opacity-20" />

      <h3 className="font-semibold mb-1 relative z-10">{title}</h3>

      <div className="flex items-center justify-between relative z-10 mt-1">
        <div className="text-center">
          <p className="text-xl font-semibold">0</p>
          <p className="text-xs">Total</p>
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold">0</p>
          <p className="text-xs">Total Return</p>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
