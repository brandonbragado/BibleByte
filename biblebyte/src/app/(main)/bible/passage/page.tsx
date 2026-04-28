import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { PassageReaderClient } from "@/components/bible/passage-reader-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = { searchParams: Promise<{ passageId?: string }> };

export default async function BiblePassagePage({ searchParams }: Props) {
  const { passageId: raw } = await searchParams;
  const passageId = raw?.trim() ?? "";

  return (
    <div className="space-y-6 pb-28 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
          <Link href="/bible">
            <ArrowLeft className="size-4" />
            Bible
          </Link>
        </Button>
      </div>

      {!passageId ? (
        <Card className="border-primary/12 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-xl">Passage</CardTitle>
            <CardDescription>
              Add <code className="rounded bg-muted px-1">passageId</code> to the URL (API.Bible id), e.g. from
              search results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/bible">Choose a book</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PassageReaderClient passageId={passageId} />
      )}
    </div>
  );
}
