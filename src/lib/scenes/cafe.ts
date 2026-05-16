import { Scene, SeatPosition } from '@/types'

const CAFE_SEATS: SeatPosition[] = [
  { id: 'seat-0', x: 10, y: 52 },
  { id: 'seat-1', x: 22, y: 33 },
  { id: 'seat-2', x: 36, y: 25 },
  { id: 'seat-3', x: 50, y: 22 },
  { id: 'seat-4', x: 64, y: 25 },
  { id: 'seat-5', x: 78, y: 37 },
  { id: 'seat-6', x: 30, y: 70 },
  { id: 'seat-7', x: 60, y: 70 },
  { id: 'seat-8', x: 45, y: 74 },
]

export const CAFE_ENVIRONMENT_EVENTS = [
  '[服务员走过来询问是否需要加单]',
  '[隔壁桌有人大声打电话]',
  '[外面突然下起了雨]',
  '[咖啡厅换了首轻音乐]',
  '[门口进来了一位新客人]',
  '[服务员送来了一壶免费续杯的水]',
  '[有人的手机响了]',
  '[窗外传来汽车鸣笛声]',
  '[空调声音突然变大了]',
  '[一只猫从脚边走过]',
]

export const CAFE_NAMES = [
  'Alabama咖啡厅', '三月兔咖啡馆', '慢时光Coffee',
  '角落书屋咖啡', '晨光Café', '街角咖啡实验室',
  '暖阳下午茶', '老树根咖啡馆', '第七杯咖啡',
  '迷路的猫咖啡', '月光海咖啡馆', '云端Coffee',
]

export const cafeScene: Scene = {
  id: 'cafe',
  name: 'AI 咖啡厅',
  description: '轻松的咖啡厅氛围，8 人围坐圆桌自由讨论',
  backgroundImage: '/aicafe.png',
  ambiance: {
    formality: 'casual',
    maxParticipants: 9,
    seatLayout: CAFE_SEATS,
    environmentEvents: CAFE_ENVIRONMENT_EVENTS,
  },
  defaultDuration: 60,
  conversationModeId: 'free-chat',
  reportTemplateId: 'casual-recap',
}
