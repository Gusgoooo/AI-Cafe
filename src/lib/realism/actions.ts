import { Persona, ConversationContext } from '@/types'

const ACTION_TEMPLATES = {
  tired: ['*打了个哈欠*', '*揉了揉眼睛*', '*趴在桌上*', '*眼神放空了一会儿*'],
  distracted: ['*掏出手机刷了一下*', '*往窗外看了看*', '*在桌上画圈圈*', '*玩起了杯盖*'],
  excited: ['*拍了下桌子*', '*身体前倾*', '*眼睛亮了*', '*差点把咖啡打翻*'],
  angry: ['*深吸一口气*', '*攥紧了杯子*', '*皱起眉头*', '*把手机拍在桌上*'],
  thinking: ['*若有所思地搅动咖啡*', '*抬头看天花板想了想*', '*用手指敲着桌面*'],
  agreeing: ['*不停点头*', '*竖起大拇指*', '*笑着拍了拍旁边人的肩膀*'],
  uncomfortable: ['*挪了挪椅子*', '*清了清嗓子*', '*尴尬地笑了笑*'],
  drink: ['*喝了口咖啡*', '*喝了口水*', '*吹了吹热咖啡*', '*叫服务员续了杯*'],
  food: ['*吃了块蛋糕*', '*掰了块饼干*', '*看了看甜品柜*'],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shouldTriggerAction(persona: Persona, ctx: ConversationContext): string | null {
  const roll = Math.random()

  if (persona.state.energyLevel < 30 && roll < 0.3) {
    return pickRandom(ACTION_TEMPLATES.tired)
  }

  if (
    persona.cognition.attentionPattern.span === 'goldfish' &&
    persona.state.consecutiveSilence > 3 &&
    roll < 0.4
  ) {
    return pickRandom(ACTION_TEMPLATES.distracted)
  }

  if (persona.state.currentMood === '兴奋' && roll < 0.25) {
    return pickRandom(ACTION_TEMPLATES.excited)
  }

  if (persona.state.currentMood === '被激怒' && roll < 0.2) {
    return pickRandom(ACTION_TEMPLATES.angry)
  }

  if (roll < persona.behavior.physicalActionFreq / 300) {
    return pickRandom(ACTION_TEMPLATES.drink)
  }

  if (roll < persona.behavior.foodDrinkMentionFreq / 500) {
    return pickRandom(ACTION_TEMPLATES.food)
  }

  return null
}

export function shouldTriggerEnvironmentEvent(ctx: ConversationContext, environmentEvents: string[]): string | null {
  if (ctx.messagesSinceLastEnvironmentEvent < 10) return null
  if (Math.random() < 0.03) {
    return pickRandom(environmentEvents)
  }
  return null
}
