import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface StatusUpdatesProps {
  title?: string
  items?: Array<{ id: string; status: string; time: string }>
}

export default function StatusUpdates({
  title = "Status Updates",
  items = [
    { id: "s1", status: "System healthy", time: "now" },
    { id: "s2", status: "Background jobs completed", time: "2m" },
  ],
}: StatusUpdatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm">{i.status}</span>
            <span className="text-xs text-muted-foreground">{i.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
