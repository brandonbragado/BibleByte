type Props = {
  prompts: readonly string[];
  onPick: (text: string) => void;
  disabled?: boolean;
};

export function PromptChips({ prompts, onPick, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick prompts">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-left text-xs font-medium text-primary transition-colors hover:bg-accent disabled:opacity-50"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
