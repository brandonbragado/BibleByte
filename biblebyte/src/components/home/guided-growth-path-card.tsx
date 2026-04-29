import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TOPICS = [
  "Anxiety & Peace",
  "Purpose & Direction",
  "Building Faith",
  "Forgiveness",
  "Marriage & Relationships",
] as const;

export function GuidedGrowthPathCard() {
  return (
    <Card className="border-primary/12 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl">Guided growth path</CardTitle>
        <CardDescription>
          Personalized journeys—daily scripture, teaching, prayer, and reflection checkpoints.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {TOPICS.map((label) => (
          <Badge key={label} variant="outline">
            {label}
          </Badge>
        ))}
        <p className="w-full pt-2 text-xs text-muted-foreground">
          Bible reading + companion chats now persist—guided path scoring comes next.
        </p>
      </CardContent>
    </Card>
  );
}
