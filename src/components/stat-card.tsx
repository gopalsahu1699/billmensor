import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <Card className={`${color} border-none shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
