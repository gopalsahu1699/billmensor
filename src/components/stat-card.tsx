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
    <Card className={color}>
      <CardContent className="p-4 text-white">
        <p className="text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
