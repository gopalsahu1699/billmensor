import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  "Create Party",
  "Create Sale",
  "Create Quotation",
  "Create Item",
  "Create Expense",
  "Create Purchase",
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      {/* ===== Header ===== */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Last 30 Days</p>
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* ===== Quick Actions ===== */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((label) => (
          <Button key={label} variant="outline" size="sm">
            {label}
          </Button>
        ))}
      </div>

      {/* ===== Summary Cards ===== */}
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

      {/* ===== Bottom Section ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            30-Day Sales Trend
          </h2>
          <div className="h-48 rounded-md bg-gray-100" />
        </div>

        {/* Stats */}
        <aside className="space-y-3">
          <SmallCard title="Total Expense" value="₹0" />
          <SmallCard title="Expense Balance" value="₹0" />
          <SmallCard title="Items" value="1" />
          <SmallCard title="Parties" value="1" />
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
    <div className={`${bg} rounded-lg p-4 text-white shadow-md`}>
      <h3 className="font-medium">{title}</h3>
      <p className="text-2xl font-semibold">₹0</p>

      {stats && (
        <div className="mt-2 space-y-1 text-sm opacity-90">
          {stats.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span>{item.value}</span>
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
    <div className={`${bg} relative overflow-hidden rounded-lg p-4 text-white shadow-md`}>
      <h3 className="mb-1 font-semibold">{title}</h3>

      <div className="mt-1 flex justify-between">
        <Stat label="Total" value="0" />
        <Stat label="Total Return" value="0" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
