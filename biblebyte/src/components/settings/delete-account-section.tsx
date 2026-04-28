import { deleteAccountAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

export async function DeleteAccountSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <Card className="border-destructive/35 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl text-destructive">Delete account</CardTitle>
        <CardDescription>
          Permanently removes your Supabase auth user and cascades linked rows (journal, prayers,
          bookmarks). This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={deleteAccountAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="confirm-delete" className="text-sm font-medium">
              Type DELETE to confirm
            </label>
            <Input
              id="confirm-delete"
              name="confirm"
              autoComplete="off"
              placeholder="DELETE"
              className="border-destructive/30"
            />
          </div>
          <Button type="submit" variant="destructive">
            Delete my account permanently
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
