import { WebSocketServer, WebSocket } from 'ws'
import { LogMessage } from '../types/index.js'

export class LogHub {
  private wss: WebSocketServer | null = null
  private recentLogs: LogMessage[] = []
  private maxLogs = 200

  public setServer(wss: WebSocketServer) {
    this.wss = wss
    this.wss.on('connection', (ws: WebSocket) => {
      // Send historical logs to newly connected client
      ws.send(JSON.stringify({ type: 'history', logs: this.recentLogs }))
    })
  }

  public emit(level: LogMessage['level'], category: LogMessage['category'], text: string, details?: Record<string, unknown>) {
    const logItem: LogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      category,
      text,
      details,
    }

    this.recentLogs.push(logItem)
    if (this.recentLogs.length > this.maxLogs) {
      this.recentLogs.shift()
    }

    const payload = JSON.stringify({ type: 'log', log: logItem })

    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload)
        }
      })
    }

    const prefix = `[${logItem.timestamp}] [${category.toUpperCase()}]`
    if (level === 'error') {
      console.error(prefix, text, details || '')
    } else if (level === 'warn') {
      console.warn(prefix, text, details || '')
    } else {
      console.log(prefix, text, details || '')
    }
  }

  public broadcast(type: string, data: unknown) {
    if (this.wss) {
      const payload = JSON.stringify({ type, data })
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload)
        }
      })
    }
  }

  public info(category: LogMessage['category'], text: string, details?: Record<string, unknown>) {
    this.emit('info', category, text, details)
  }

  public success(category: LogMessage['category'], text: string, details?: Record<string, unknown>) {
    this.emit('success', category, text, details)
  }

  public warn(category: LogMessage['category'], text: string, details?: Record<string, unknown>) {
    this.emit('warn', category, text, details)
  }

  public error(category: LogMessage['category'], text: string, details?: Record<string, unknown>) {
    this.emit('error', category, text, details)
  }

  public getHistory(): LogMessage[] {
    return this.recentLogs
  }
}

export const logHub = new LogHub()
