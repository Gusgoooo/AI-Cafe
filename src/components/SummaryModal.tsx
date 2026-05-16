'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'

interface SummaryModalProps {
  visible: boolean
  onClose: () => void
  onGenerateReport: () => void
  onBackToHome: () => void
  messageCount: number
}

export default function SummaryModal({
  visible,
  onClose,
  onGenerateReport,
  onBackToHome,
  messageCount,
}: SummaryModalProps) {
  return (
    <Dialog open={visible} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 border-none shadow-none sdv-panel !fixed">
        <div className="sdv-panel-inner">
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm sdv-title">讨论结束</DialogTitle>
            <DialogDescription>
              本次讨论共产生 {messageCount} 条消息。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-col mt-4">
            <button
              onClick={onGenerateReport}
              className="w-full py-3 sdv-button font-bold cursor-pointer"
            >
              生成讨论报告
            </button>
            <button
              onClick={onBackToHome}
              className="w-full py-3 sdv-input font-bold text-foreground cursor-pointer hover:bg-accent transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              继续讨论
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
