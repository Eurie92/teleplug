import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Trash2, Copy, Wifi, WifiOff, Check } from 'lucide-react'
import { LogMessage } from '../../server/types/index.js'

export const LiveConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState<'all' | 'plugger' | 'forwarder' | 'auth' | 'system'>('all')
  const [copied, setCopied] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: NodeJS.Timeout

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/ws`

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setConnected(true)
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'history') {
            setLogs(payload.logs || [])
          } else if (payload.type === 'log') {
            setLogs((prev) => [...prev.slice(-300), payload.log])
          }
        } catch (err) {
          console.error('Failed to parse WS payload:', err)
        }
      }
    }

    connect()

    return () => {
      if (ws) ws.close()
      clearTimeout(reconnectTimer)
    }
  }, [])

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter((l) => (filter === 'all' ? true : l.category === filter))

  const handleCopy = () => {
    const raw = logs.map((l) => `[${l.timestamp}] [${l.category.toUpperCase()}] ${l.text}`).join('\n')
    navigator.clipboard.writeText(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLevelColor = (level: LogMessage['level']) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400'
      case 'warn':
        return 'text-amber-400'
      case 'error':
        return 'text-rose-400'
      default:
        return 'text-gray-300'
    }
  }

  const getCategoryBadge = (category: LogMessage['category']) => {
    switch (category) {
      case 'plugger':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'forwarder':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'auth':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700'
    }
  }

  return (
    <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-4">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#242f3d] gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-[#24A1DE]" />
          <h3 className="text-sm font-semibold text-white">Live Execution Console</h3>
          <div className="flex items-center space-x-1.5 ml-2 text-xs">
            {connected ? (
              <span className="flex items-center space-x-1 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-rose-400">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Reconnecting...</span>
              </span>
            )}
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex bg-[#0e1621] p-1 rounded-xl border border-[#242f3d]">
            {(['all', 'plugger', 'forwarder', 'auth'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  filter === cat
                    ? 'bg-[#24A1DE] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 bg-[#0e1621] hover:bg-[#242f3d] text-gray-400 hover:text-white rounded-lg border border-[#242f3d]"
            title="Copy Logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-1.5 bg-[#0e1621] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg border border-[#242f3d]"
            title="Clear Console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#0e1621] border border-[#242f3d] rounded-xl p-4 font-mono text-[11px] leading-relaxed h-[360px] overflow-y-auto space-y-1.5 select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-600 italic py-10 text-center">
            Waiting for events... Messages and activity logs will stream here in real-time.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="text-gray-600 flex-shrink-0">[{log.timestamp}]</span>
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold uppercase flex-shrink-0 ${getCategoryBadge(log.category)}`}>
                {log.category}
              </span>
              <span className={`break-all ${getLevelColor(log.level)}`}>
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
