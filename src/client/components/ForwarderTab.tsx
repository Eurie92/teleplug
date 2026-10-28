import React, { useState } from 'react'
import { Plus, Trash2, ArrowRight, Play, Square, Filter, Radio, MessageSquare, Check, X } from 'lucide-react'
import { ForwardRoute, ForwarderSettings } from '../../server/types/index.js'

interface ForwarderTabProps {
  settings: ForwarderSettings
  isForwarderRunning: boolean
  isAuthorized: boolean
  onUpdate: (updated: Partial<ForwarderSettings>) => void
  onToggle: (enabled: boolean) => void
}

export const ForwarderTab: React.FC<ForwarderTabProps> = ({
  settings,
  isForwarderRunning,
  isAuthorized,
  onUpdate,
  onToggle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [sourceChat, setSourceChat] = useState('')
  const [targetChat, setTargetChat] = useState('')
  const [keywordsStr, setKeywordsStr] = useState('')
  const [excludeKeywordsStr, setExcludeKeywordsStr] = useState('')
  const [cleanCopy, setCleanCopy] = useState(true)
  const [customFooter, setCustomFooter] = useState('')

  const handleAddRoute = () => {
    if (!sourceChat || !targetChat) return

    const newRoute: ForwardRoute = {
      id: Math.random().toString(36).substring(2, 9),
      name: routeName || `Route ${settings.routes.length + 1}`,
      enabled: true,
      sourceChatId: sourceChat.trim(),
      targetChatId: targetChat.trim(),
      keywords: keywordsStr ? keywordsStr.split(',').map((k) => k.trim()).filter(Boolean) : [],
      excludeKeywords: excludeKeywordsStr ? excludeKeywordsStr.split(',').map((k) => k.trim()).filter(Boolean) : [],
      cleanCopy,
      customFooter: customFooter.trim() || undefined,
    }

    onUpdate({ routes: [...settings.routes, newRoute] })
    setIsModalOpen(false)
    // Reset form
    setRouteName('')
    setSourceChat('')
    setTargetChat('')
    setKeywordsStr('')
    setExcludeKeywordsStr('')
    setCleanCopy(true)
    setCustomFooter('')
  }

  const handleDeleteRoute = (id: string) => {
    onUpdate({ routes: settings.routes.filter((r) => r.id !== id) })
  }

  const handleToggleRoute = (id: string, enabled: boolean) => {
    onUpdate({
      routes: settings.routes.map((r) => (r.id === id ? { ...r, enabled } : r)),
    })
  }

  return (
    <div className="space-y-6">
      {/* Engine Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isForwarderRunning
          ? 'bg-gradient-to-r from-blue-950/40 to-[#17212b] border-blue-500/40 shadow-lg shadow-blue-950/20'
          : 'bg-[#17212b] border-[#242f3d]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              isForwarderRunning ? 'bg-[#24A1DE] text-white shadow-lg shadow-sky-500/30' : 'bg-[#242f3d] text-gray-400'
            }`}>
              <Radio className="w-6 h-6" />
            </div>
            {isForwarderRunning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#24A1DE]"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>Auto-Forwarder & Chat Mirror</span>
              {isForwarderRunning && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#24A1DE]/20 text-[#24A1DE] font-normal">
                  Live Listening
                </span>
              )}
            </h2>
            <p className="text-xs text-[#708499]">
              {isForwarderRunning
                ? `Actively listening to ${settings.routes.filter(r => r.enabled).length} configured forward routes in real-time.`
                : 'Forwarding engine is paused. Add your routing configurations below and start listening.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onToggle(!isForwarderRunning)}
            disabled={!isAuthorized || settings.routes.length === 0}
            className={`px-6 py-3 rounded-xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
              isForwarderRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-[#24A1DE] hover:bg-[#1d8bc0] text-white shadow-sky-900/30'
            }`}
          >
            {isForwarderRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Forwarder</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Listening</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Routes List */}
      <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#24A1DE]" />
            <h3 className="text-sm font-semibold text-white">Configured Forwarding Routes</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#24A1DE]/20 text-[#24A1DE] font-medium">
              {settings.routes.length} Total
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#24A1DE] hover:bg-[#1d8bc0] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Forward Route</span>
          </button>
        </div>

        {settings.routes.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs border border-dashed border-[#242f3d] rounded-xl">
            No forwarding routes created yet. Click "Add Forward Route" to start forwarding signals, trades, or messages between chats!
          </div>
        ) : (
          <div className="space-y-3">
            {settings.routes.map((route) => (
              <div
                key={route.id}
                className="bg-[#0e1621] border border-[#242f3d] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">{route.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      route.enabled
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {route.enabled ? 'Active' : 'Disabled'}
                    </span>
                    {route.cleanCopy && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        Clean Repost
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                    <span className="text-[#24A1DE] bg-[#17212b] px-2 py-0.5 rounded border border-[#242f3d]">
                      {route.sourceChatId}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-emerald-400 bg-[#17212b] px-2 py-0.5 rounded border border-[#242f3d]">
                      {route.targetChatId}
                    </span>
                  </div>

                  {(route.keywords.length > 0 || route.excludeKeywords.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                      {route.keywords.map((kw) => (
                        <span key={kw} className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          +{kw}
                        </span>
                      ))}
                      {route.excludeKeywords.map((ex) => (
                        <span key={ex} className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                          -{ex}
                        </span>
                      ))}
                    </div>
                  )}

                  {route.customFooter && (
                    <p className="text-[11px] text-gray-500 truncate max-w-md">
                      Append plug: <span className="text-gray-300 italic">{route.customFooter}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRoute(route.id, !route.enabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      route.enabled
                        ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {route.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#17212b] border border-[#242f3d] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242f3d]">
              <h3 className="text-base font-semibold text-white">Create Forwarding Route</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#708499] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#708499] block mb-1">Route Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Signals to Free Channel"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#708499] block mb-1">Source Chat ID or @username</label>
                  <input
                    type="text"
                    placeholder="-100123456789 or @source"
                    value={sourceChat}
                    onChange={(e) => setSourceChat(e.target.value)}
                    className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                  />
                </div>
                <div>
                  <label className="text-[#708499] block mb-1">Target Chat ID or @username</label>
                  <input
                    type="text"
                    placeholder="-100987654321 or @target"
                    value={targetChat}
                    onChange={(e) => setTargetChat(e.target.value)}
                    className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#708499] block mb-1">Keyword Whitelist (comma-separated, optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SOL, BUY, BREAKOUT, SIGNAL"
                  value={keywordsStr}
                  onChange={(e) => setKeywordsStr(e.target.value)}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>

              <div>
                <label className="text-[#708499] block mb-1">Keyword Blacklist (comma-separated, optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AIRDROP, SPAM, REF_LINK"
                  value={excludeKeywordsStr}
                  onChange={(e) => setExcludeKeywordsStr(e.target.value)}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="cleanCopy"
                  checked={cleanCopy}
                  onChange={(e) => setCleanCopy(e.target.checked)}
                  className="rounded bg-[#0e1621] border-[#242f3d] text-[#24A1DE] focus:ring-0"
                />
                <label htmlFor="cleanCopy" className="text-gray-300 cursor-pointer">
                  Clean Repost (removes "Forwarded from" header and sends as fresh message)
                </label>
              </div>

              {cleanCopy && (
                <div>
                  <label className="text-[#708499] block mb-1">Append Custom Footer Plug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 📢 Join our group: t.me/mycommunity"
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#242f3d]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#242f3d] text-gray-300 hover:bg-[#2b394a] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoute}
                disabled={!sourceChat || !targetChat}
                className="px-5 py-2 rounded-xl bg-[#24A1DE] hover:bg-[#1d8bc0] text-white text-xs font-medium disabled:opacity-50"
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
