import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted/70 backdrop-blur-[1px]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
