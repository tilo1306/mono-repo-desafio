import { BorderBeam } from '@/components/ui/border-beam'

type Props = {
  title: string
  text: string
  icon: React.ReactNode
}

export function MiniCard({ title, text, icon }: Props) {
  return (
    <div className="relative flex w-full max-w-full items-start gap-3 rounded-xl border p-4 break-words">
      <BorderBeam
        size={60}
        duration={8}
        delay={0}
        colorFrom="#06b6d4"
        colorTo="#2563eb"
      />
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-card-foreground font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </div>
  )
}
