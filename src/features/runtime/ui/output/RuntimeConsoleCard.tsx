interface RuntimeConsoleCardProps {
  outputs: string[]
}

export function RuntimeConsoleCard({ outputs }: RuntimeConsoleCardProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/35 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consola</p>
      <div className="max-h-52 space-y-1 overflow-auto break-words rounded-lg border border-border/60 bg-card/85 p-2 font-mono text-sm text-foreground">
        {outputs.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  )
}
