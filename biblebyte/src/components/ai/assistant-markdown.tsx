import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-2 mt-3 text-lg font-semibold text-foreground first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 mt-3 text-base font-semibold text-foreground first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 text-sm leading-relaxed last:mb-0" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-sm leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-2 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-2 max-h-48 overflow-x-auto overflow-y-auto rounded-lg border border-border/60 bg-background/80 p-2 text-xs"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={
        className ??
        "rounded bg-background/90 px-1 py-0.5 font-mono text-[0.85em] text-foreground"
      }
      {...props}
    >
      {children}
    </code>
  ),
};

type Props = {
  content: string;
  className?: string;
};

/** Renders assistant markdown (###, **bold**, lists) — no raw HTML pass-through. */
export function AssistantMessageMarkdown({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
