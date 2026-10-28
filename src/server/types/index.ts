export interface PluggerSettings {
  enabled: boolean
  intervalMinutes: number // 60, 120, 180, or custom
  intervalVariancePercent: number // e.g. 10%
  messageTemplate: string
  minDelaySec: number // delay between each group post (e.g. 20)
  maxDelaySec: number // delay between each group post (e.g. 45)
  targetGroupIds: string[] // specific group chat_ids selected for plugging
}

export interface ForwardRoute {
  id: string
  name: string
  enabled: boolean
  sourceChatId: string // channel/group ID or username
  targetChatId: string // destination channel/group ID or username
  keywords: string[] // whitelist: only forward if message contains one of these
  excludeKeywords: string[] // blacklist: skip if message contains one of these
  cleanCopy: boolean // true = post fresh message without 'Forwarded from' header
  customFooter?: string // optional marketing plug to append
}

export interface ForwarderSettings {
  enabled: boolean
  routes: ForwardRoute[]
}

export interface TelegramCredentials {
  apiId: number | null
  apiHash: string | null
  phone: string | null
  isAuthorized: boolean
  userName: string | null
  userId: number | null
}

export interface AppConfig {
  plugger: PluggerSettings
  forwarder: ForwarderSettings
  credentials: TelegramCredentials
}

export interface TelegramGroup {
  id: string
  title: string
  username?: string
  type: 'group' | 'supergroup' | 'channel'
  memberCount?: number
  canSendMessages: boolean
  isTarget: boolean
}

export interface LogMessage {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  category: 'plugger' | 'forwarder' | 'auth' | 'system'
  text: string
  details?: Record<string, unknown>
}
