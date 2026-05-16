import { ConversationMode } from '@/types'

export const freeChatMode: ConversationMode = {
  id: 'free-chat',
  turnTaking: 'organic',
  rules: {
    allowFreeChat: true,
    requireTopicStick: false,
    enableDebate: true,
    moderatorCanMute: false,
  },
}
