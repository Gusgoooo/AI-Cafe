import { Room } from '@/types'

const ROOMS_KEY = 'ai-cafe-rooms'

export function getRooms(): Room[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(ROOMS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function getRoom(id: string): Room | null {
  return getRooms().find(r => r.id === id) ?? null
}

export function saveRoom(room: Room): void {
  const rooms = getRooms()
  const idx = rooms.findIndex(r => r.id === room.id)
  if (idx >= 0) {
    rooms[idx] = room
  } else {
    rooms.unshift(room)
  }
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
}

export function deleteRoom(id: string): void {
  const rooms = getRooms().filter(r => r.id !== id)
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
}
