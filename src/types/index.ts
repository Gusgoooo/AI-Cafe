// ==================== Persona ====================

export interface PersonaIdentity {
  age: number
  gender: string
  occupation: string
  education: string
  incomeLevel: string
  region: string
  familyStatus: string
  background: string
  coreValues: string[]
  lifeStage: string
}

export interface PersonaHook {
  quote: string
  tags: string[]
}

export interface PersonaRadar {
  rationality: number
  sensibility: number
  techAcceptance: number
  spendingImpulse: number
  socialActivity: number
}

export interface PersonaTraits {
  extroversion: number
  agreeableness: number
  openness: number
  neuroticism: number
  conscientiousness: number
  humor: number
  assertiveness: number
  empathy: number
  patience: number
  curiosity: number
  stubbornness: number
  selfAwareness: number
}

export interface AttentionPattern {
  span: 'goldfish' | 'short' | 'normal' | 'deep'
  selectiveFocus: string[]
  distractors: string[]
}

export interface MemoryModel {
  shortTerm: number
  emotionalMemory: number
  detailRetention: number
}

export interface PersonaCognition {
  thinkingStyle: 'analytical' | 'intuitive' | 'pragmatic' | 'creative'
  argumentStyle: 'logical' | 'emotional' | 'anecdotal' | 'authoritative'
  biases: string[]
  knowledgeDomains: string[]
  knowledgeGaps: string[]
  attentionPattern: AttentionPattern
  memoryModel: MemoryModel
}

export interface RepresentativeItem {
  name: string
  emoji: string
}

export interface ConsumerDna {
  buyingLogic: string
  priceRange: string
  brandAttitude: string
  triggerKeywords: string[]
  representativeItems: RepresentativeItem[]
}

export interface PersonaFriction {
  howToAnger: string[]
  hotTopics: string[]
  allyKeywords: string[]
  avoidTopics: string[]
  defenseMechanism: string
}

export type SocialRole =
  | 'leader' | 'mediator' | 'contrarian' | 'cheerleader'
  | 'observer' | 'joker' | 'expert' | 'storyteller'
  | 'devil-advocate' | 'peacemaker'

export type HumorStyle = 'none' | 'dry' | 'sarcastic' | 'slapstick' | 'self-deprecating'

export interface PersonaSocial {
  statusSensitivity: number
  conformityTendency: number
  faceSaving: number
  politenessLevel: number
  gossipTendency: number
  backchannelingFreq: 'none' | 'rare' | 'moderate' | 'constant'
  complimentStyle: 'never' | 'subtle' | 'direct' | 'excessive'
  criticismStyle: 'avoid' | 'indirect' | 'direct' | 'brutal'
  humorStyle: HumorStyle
  storytellingAbility: number
  socialRole: SocialRole
}

export interface PersonaVoice {
  verbosity: 'terse' | 'normal' | 'verbose' | 'rambling'
  formality: 'casual' | 'normal' | 'formal' | 'academic'
  emojiUsage: 'none' | 'rare' | 'moderate' | 'heavy'
  memeUsage: 'none' | 'rare' | 'moderate' | 'heavy'
  punctuation: 'minimal' | 'normal' | 'expressive' | 'chaotic'
  responseLength: [number, number]
  typingSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  languages: string[]
  catchphrases: string[]
  textHabits: string[]
  tone: string
  exampleSentences: string[]
  fillerWords: string[]
  hedgingPhrases: string[]
  intensifiers: string[]
  agreementPhrases: string[]
  disagreementPhrases: string[]
  sentenceStructure: string
  quotationHabit: string
}

export type DisagreementReaction = 'avoid' | 'defend' | 'attack' | 'concede' | 'redirect'
export type EngagementCurve = 'steady' | 'fading' | 'warming' | 'burst' | 'erratic'

export interface PersonaBehavior {
  initiativeLevel: number
  interruptTendency: number
  tangentProbability: number
  reactionToDisagreement: DisagreementReaction
  engagementCurve: EngagementCurve
  phoneCheckFrequency: number
  foodDrinkMentionFreq: number
  physicalActionFreq: number
  latecomerBehavior: string
  exitBehavior: string
}

export interface PersonaMeta {
  roleTags: string[]
  archetypeId: string
  generationSource: 'ai' | 'user-data'
}

export interface RelationshipState {
  affinity: number
  respect: number
  trust: number
  annoyance: number
}

export interface PersonaState {
  currentMood: string
  moodIntensity: number
  energyLevel: number
  interestLevel: number
  stance: string
  stanceConfidence: number
  relationshipMap: Record<string, RelationshipState>
  notableMemories: string[]
  runningJokes: string[]
  topicFatigue: Record<string, number>
  consecutiveSilence: number
  lastSpokenIndex: number
}

export interface PersonaAiConfig {
  temperature: number
  contextWindow: 'last' | 'recent' | 'all' | 'selective'
  contextFocus?: string[]
  systemPromptVersion: string
}

export interface Persona {
  id: string
  name: string
  avatar: string
  badgeColor: string
  identity: PersonaIdentity
  hook: PersonaHook
  radar: PersonaRadar
  traits: PersonaTraits
  cognition: PersonaCognition
  consumerDna: ConsumerDna
  friction: PersonaFriction
  social: PersonaSocial
  voice: PersonaVoice
  behavior: PersonaBehavior
  meta: PersonaMeta
  state: PersonaState
  aiConfig: PersonaAiConfig
}

// ==================== Message ====================

export interface Message {
  id: string
  personaId: string | 'user'
  content: string
  action?: string
  meme?: string
  mentions?: string[]
  timestamp: number
  emotionalImpact?: Record<string, number>
  isJokeWorthy?: boolean
  retrospectiveRef?: string
}

// ==================== Room ====================

export interface Room {
  id: string
  crowdDescription: string
  topic: string
  duration: number
  personas: Persona[]
  messages: Message[]
  createdAt: number
  endedAt?: number
  cafeName: string
  weather: { emoji: string; temp: number }
  sceneId: string
  stateHistory: StateSnapshot[]
}

export interface StateSnapshot {
  messageIndex: number
  timestamp: number
  personaStates: Record<string, PersonaState>
}

// ==================== AI Response ====================

export interface AIResponse {
  content: string
  action?: string
  meme?: string
  internalThought?: string
  moodChange?: { newMood: string; intensity: number }
  mentionedMemory?: string
  topicShift?: string
  retrospectiveRef?: string
  isJokeWorthy?: boolean
}

// ==================== Conversation Context ====================

export interface ConversationContext {
  messages: Message[]
  lastMessage: Message
  lastSpeakers: string[]
  messageCount: number
  estimatedTotalMessages: number
  currentTopic: string
  currentTopicKeywords: string[]
  majorityAgree: boolean
  isHeatedDebate: boolean
  lastMessageWasDeep: boolean
  messagesSinceLastEnvironmentEvent: number
  sessionProgress: number
}

// ==================== Scene System ====================

export interface SeatPosition {
  id: string
  x: number
  y: number
}

export interface SceneAmbiance {
  formality: 'casual' | 'semi-formal' | 'formal'
  maxParticipants: number
  seatLayout: SeatPosition[]
  environmentEvents: string[]
}

export interface Scene {
  id: string
  name: string
  description: string
  backgroundImage: string
  ambiance: SceneAmbiance
  defaultDuration: number
  conversationModeId: string
  reportTemplateId: string
}

// ==================== Conversation Mode ====================

export type TurnTaking = 'organic' | 'moderated' | 'round-robin'

export interface ConversationModeRules {
  allowFreeChat: boolean
  requireTopicStick: boolean
  enableDebate: boolean
  moderatorCanMute: boolean
}

export interface ConversationPhase {
  name: string
  objective: string
  durationPercent: number
  promptOverride?: string
}

export interface InterviewFramework {
  id: string
  name: string
  stages: {
    name: string
    duration: number
    questions: string[]
    probes: string[]
    objective: string
  }[]
  analysisTemplate: string
}

export interface ConversationMode {
  id: string
  turnTaking: TurnTaking
  moderator?: {
    role: 'user' | 'ai'
    framework?: InterviewFramework
  }
  phases?: ConversationPhase[]
  rules: ConversationModeRules
}

// ==================== Persona Factory ====================

export interface PersonaFactoryConfig {
  type: 'ai-generated' | 'data-driven' | 'template' | 'hybrid'
}

// ==================== Report ====================

export interface SlideTemplate {
  id: string
  type: string
  title: string
}

export interface ReportTemplate {
  id: string
  slides: SlideTemplate[]
  exportFormats: ('html' | 'pdf' | 'pptx')[]
}

export interface PersonaSummary {
  personaId: string
  name: string
  stance: string
  stanceEvolution: string
  keyQuotes: string[]
  messageCount: number
  avgSentiment: number
  notableActions: string[]
}

export interface TopicFlowItem {
  topic: string
  startMessageIndex: number
  endMessageIndex: number
  participants: string[]
}

export interface GroupDynamics {
  alliances: [string, string][]
  rivalries: [string, string][]
  influencers: string[]
  outliers: string[]
  polarizationIndex: number
}

export interface SentimentPoint {
  messageIndex: number
  avgSentiment: number
  peakMoment?: string
}

export interface ReportData {
  title: string
  overview: string
  keyInsights: string[]
  consensusPoints: string[]
  controversialPoints: string[]
  personaSummaries: PersonaSummary[]
  topicFlow: TopicFlowItem[]
  groupDynamics: GroupDynamics
  sentimentTimeline: SentimentPoint[]
  runningJokes: string[]
  surprisingMoments: string[]
}

// ==================== API Input/Output ====================

export interface GeneratePersonasInput {
  crowdDescription: string
  topic: string
  userData?: {
    type: 'json' | 'csv' | 'text'
    content: string
  }
  count?: number
}

// ==================== Realism Engine ====================

export interface SessionArcPhase {
  name: string
  start: number
  end: number
}

export interface SessionArc {
  phases: SessionArcPhase[]
}

export interface SubgroupEvent {
  type: 'alliance' | 'rivalry' | 'sideChat' | 'isolation' | 'mediation'
  participants: string[]
  trigger: string
}

export interface RunningJoke {
  content: string
  origin: string
  messageIndex: number
  referenceCount: number
}

export type ConversationTempo = 'rapid-fire' | 'normal' | 'slow' | 'dead-air'

export interface ConversationRhythm {
  currentTempo: ConversationTempo
  recentMessageGaps: number[]
}

// ==================== SSE Events ====================

export type SSEEventType =
  | 'typing-start'
  | 'action'
  | 'token'
  | 'meme'
  | 'mood-change'
  | 'message-end'
  | 'state-update'

export interface SSEEvent {
  type: SSEEventType
  personaId: string
  data: string
}
