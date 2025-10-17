import { Card, CardContent } from '@/components/ui/card'

type Props = {
  title: string
  text: string
}

export function Stat({ title, text }: Props) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-5">
        <p className="text-sm tracking-wide text-slate-300 uppercase">
          {title}
        </p>
        <p className="mt-1 text-lg font-semibold">{text}</p>
      </CardContent>
    </Card>
  )
}
