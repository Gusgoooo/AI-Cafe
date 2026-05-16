'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Room } from '@/types'
import { getRoom } from '@/lib/storage'
import ChatRoom from '@/components/ChatRoom'

export default function RoomPage() {
  const params = useParams()
  const id = params.id as string
  const [room, setRoom] = useState<Room | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const r = getRoom(id)
    if (r) {
      setRoom(r)
    } else {
      setNotFound(true)
    }
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-amber-900 mb-2">房间不存在</h2>
          <a href="/" className="text-amber-600 hover:underline text-sm">
            返回首页
          </a>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-600">加载中…</p>
      </div>
    )
  }

  return <ChatRoom room={room} />
}
