'use client'

export default function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{name} 正在输入</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  )
}
