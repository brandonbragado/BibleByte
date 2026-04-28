import { createPrayer } from "@/app/(main)/journal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PrayerCreateForm() {
  return (
    <form
      action={createPrayer}
      className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">New request</p>
      <Textarea name="request" placeholder="What would you like God to hear?" rows={3} required />
      <Input name="notes" placeholder="Private notes (optional)" />
      <Button type="submit" size="sm">
        Save prayer
      </Button>
    </form>
  );
}
