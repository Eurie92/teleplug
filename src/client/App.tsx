import React, { useState, useEffect } from 'react'
import { Radio, Send, Terminal, Shield, RefreshCw, Layers } from 'lucide-react'
import { AppConfig, TelegramCredentials } from '../server/types/index.js'
import { AuthCard } from './components/AuthCard.js'
import { PluggerTab } from './components/PluggerTab.js'
import { ForwarderTab } from './components/ForwarderTab.js'
import { LiveConsole } from './components/LiveConsole.js'

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isPluggerRunning, setIsPluggerRunning] = useState(false)
  const [isForwarderRunning, setIsForwarderRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'plugger' | 'forwarder' | 'console' | 'account'>('plugger')
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        setIsPluggerRunning(data.isPluggerRunning)
        setIsForwarderRunning(data.isForwarderRunning)
      }
    } catch (err) {
      console.error('Failed to fetch status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleUpdatePlugger = async (updated: Partial<AppConfig['plugger']>) => {
    if (!config) return
    const nextPlugger = { ...config.plugger, ...updated }
    setConfig({ ...config, plugger: nextPlugger })

    try {
      await fetch('/api/config/plugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPlugger),
      })
    } catch (err) {
      console.error('Failed to update plugger settings:', err)
    }
  }

  const handleTogglePlugger = async (enabled: boolean) => {
    setIsPluggerRunning(enabled)
    try {
      await fetch('/api/plugger/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      fetchStatus()
    } catch (err) {
      console.error('Failed to toggle plugger:', err)
    }
  }

  const handleUpdateForwarder = async (updated: Partial<AppConfig['forwarder']>) => {
    if (!config) return
    const nextForwarder = { ...config.forwarder, ...updated }
    setConfig({ ...config, forwarder: nextForwarder })

    try {
      await fetch('/api/config/forwarder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextForwarder),
      })
    } catch (err) {
      console.error('Failed to update forwarder settings:', err)
    }
  }

  const handleToggleForwarder = async (enabled: boolean) => {
    setIsForwarderRunning(enabled)
    try {
      await fetch('/api/forwarder/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      fetchStatus()
    } catch (err) {
      console.error('Failed to toggle forwarder:', err)
    }
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e1621] text-white">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#24A1DE]" />
          <span className="text-sm font-medium">Loading Auto-Plugger Control Center...</span>
        </div>
      </div>
    )
  }

  const credentials = config.credentials

  return (
    <div className="min-h-screen bg-[#0e1621] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#17212b] border-b border-[#242f3d] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#24A1DE] flex items-center justify-center text-white shadow-md shadow-[#24A1DE]/20">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Auto-Plugger</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#24A1DE]/20 text-[#24A1DE] font-normal">
                  v1.0
                </span>
              </h1>
              <p className="text-[10px] text-[#708499]">24/7 Telegram Marketing & Message Forwarder</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Status indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs">
              <span className={`w-2 h-2 rounded-full ${credentials.isAuthorized ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-gray-300 font-medium">
                {credentials.isAuthorized ? `@${credentials.userName || 'Online'}` : 'Not Connected'}
              </span>
            </div>

            <button
              onClick={fetchStatus}
              className="p-2 rounded-xl bg-[#0e1621] hover:bg-[#242f3d] text-gray-400 hover:text-white border border-[#242f3d] transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Account Banner (Quick setup if not authorized) */}
        {!credentials.isAuthorized && (
          <AuthCard credentials={credentials} onRefresh={fetchStatus} />
        )}

        {/* Navigation Tabs */}
        <div className="flex bg-[#17212b] p-1.5 rounded-2xl border border-[#242f3d] max-w-xl">
          <button
            onClick={() => setActiveTab('plugger')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'plugger'
                ? 'bg-[#24A1DE] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Auto-Plugger</span>
            {isPluggerRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('forwarder')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'forwarder'
                ? 'bg-[#24A1DE] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Forwarder</span>
            {isForwarderRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'console'
                ? 'bg-[#24A1DE] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'account'
                ? 'bg-[#24A1DE] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'plugger' && (
          <PluggerTab
            settings={config.plugger}
            isPluggerRunning={isPluggerRunning}
            isAuthorized={credentials.isAuthorized}
            onUpdate={handleUpdatePlugger}
            onToggle={handleTogglePlugger}
          />
        )}

        {activeTab === 'forwarder' && (
          <ForwarderTab
            settings={config.forwarder}
            isForwarderRunning={isForwarderRunning}
            isAuthorized={credentials.isAuthorized}
            onUpdate={handleUpdateForwarder}
            onToggle={handleToggleForwarder}
          />
        )}

        {activeTab === 'console' && <LiveConsole />}

        {activeTab === 'account' && (
          <AuthCard credentials={credentials} onRefresh={fetchStatus} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#242f3d] py-4 bg-[#0e1621] text-center text-xs text-[#708499]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Ready for 24/7 BotKeep Cloud deployment</span>
          <span className="text-[11px] font-mono">TypeScript • React 19 • @mtcute MTProto</span>
        </div>
      </footer>
    </div>
  )
}

export default App
