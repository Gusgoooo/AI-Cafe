'use client'

interface DataImportProps {
  onData: (data: { type: 'json' | 'csv' | 'text'; content: string } | null) => void
}

export default function DataImport({ onData: _onData }: DataImportProps) {
  return (
    <button
      className="w-full py-2 text-sm text-muted-foreground/50 cursor-not-allowed border border-dashed border-muted-foreground/20 rounded-md"
      disabled
    >
      导入数据（即将支持）
    </button>
  )
}
