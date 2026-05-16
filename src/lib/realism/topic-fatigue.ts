import { Persona } from '@/types'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shouldShiftTopic(
  personas: Persona[],
  currentTopic: string
): { personaId: string; transitionPhrase: string } | null {
  const avgFatigue =
    personas.reduce((sum, p) => sum + (p.state.topicFatigue[currentTopic] ?? 0), 0) /
    personas.length

  if (avgFatigue < 30) return null

  const candidates = personas
    .filter(
      p =>
        (p.state.topicFatigue[currentTopic] ?? 0) > 40 &&
        p.behavior.tangentProbability > 30
    )
    .sort((a, b) => b.behavior.tangentProbability - a.behavior.tangentProbability)

  if (candidates.length === 0) return null

  const methods = [
    '等等，这让我想到一个完全不同的事——',
    '你们发现没有——',
    '岔个题，我突然好奇——',
    '行了行了这个点翻来覆去的，聊点别的——',
    '诶我刚想到个更离谱的——',
    '这个问题聊到底了，我抛个新的——',
    '打住打住，我脑子里冒出一个更要命的问题——',
    '我们一直在说表面，有个底层逻辑没人碰——',
    '刚才谁说的那个让我联想到另一件事——',
    '换条赛道，你们想过没有——',
    '好，这个先停一下。有个相关的但完全不同角度的——',
    '你们有没有觉得我们一直在回避一个真正的问题——',
    '这个话题不能再绕了。核心矛盾其实是——',
    '我忍很久了，有个更根本的问题你们都没碰——',
    '别在这个坑里转了，我把它升维看——',
    '好了好了我们聊了半天都是果，谁来聊因？',
    '我插个嘴——有个跟这相关的新闻你们看了没？',
    '这让我想起我那个行业里一模一样的困境——',
    '其实这个问题换个人群来看完全不一样——',
    '你们说了半天都是理论，我来讲个真实的——',
    '等等我有个数据想和你们说——',
    '先不论观点对错，我发现我们忽略了一个关键变量——',
  ]

  return {
    personaId: candidates[0].id,
    transitionPhrase: pickRandom(methods),
  }
}

export function updateTopicFatigue(personas: Persona[], currentTopic: string) {
  for (const p of personas) {
    p.state.topicFatigue[currentTopic] = (p.state.topicFatigue[currentTopic] ?? 0) + 2
  }
}
