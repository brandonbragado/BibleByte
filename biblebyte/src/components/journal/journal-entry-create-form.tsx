import { createJournalEntry } from "@/app/(main)/journal/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function JournalEntryCreateForm() {
  return (
    <form
      action={createJournalEntry}
      className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">New entry</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="kind" value="reflection" required defaultChecked />
          Reflection
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="kind" value="gratitude" />
          Gratitude
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="kind" value="insight" />
          Insight
        </label>
      </div>
      <Textarea name="body" rows={4} placeholder="Write freely…" required />
      <Button type="submit" size="sm">
        Save entry
      </Button>
    </form>
  );
}
