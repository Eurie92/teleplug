import React, { useState } from 'react'
import { Play, Square, Clock, Shuffle, Users, Eye, Sparkles, AlertTriangle } from 'lucide-react'
import { PluggerSettings } from '../../server/types/index.js'
import { GroupSelectorModal } from './GroupSelectorModal.js'

interface PluggerTabProps {
  settings: PluggerSettings
  isPluggerRunning: boolean
  isAuthorized: boolean
  onUpdate: (updated: Partial<PluggerSettings>) => void
  onToggle: (enabled: boolean) => void
}

export const PluggerTab: React.FC<PluggerTabProps> = ({
  settings,
  isPluggerRunning,
  isAuthorized,
  onUpdate,
  onToggle,
}) => {
  const [template, setTemplate] = useState(settings.messageTemplate)
  const [intervalMin, setIntervalMin] = useState(settings.intervalMinutes)
  const [minDelay, setMinDelay] = useState(settings.minDelaySec)
  const [maxDelay, setMaxDelay] = useState(settings.maxDelaySec)
  const [previewText, setPreviewText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSave = () => {
    onUpdate({
      messageTemplate: template,
      intervalMinutes: intervalMin,
      minDelaySec: minDelay,
      maxDelaySec: maxDelay,
    })
  }

  const generatePreview = () => {
    // Client-side quick spintax evaluator
    const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/g
    let resolved = template
    let passes = 10
    while (passes > 0 && spintaxRegex.test(resolved)) {
      passes--
      resolved = resolved.replace(spintaxRegex, (_, choicesStr) => {
        const choices = choicesStr.split('|')
        return choices[Math.floor(Math.random() * choices.length)].trim()
      })
    }
    resolved = resolved
      .replace(/\{group_name\}/gi, 'Crypto Community Alpha')
      .replace(/\{time\}/gi, new Date().toLocaleTimeString())
      .replace(/\{date\}/gi, new Date().toLocaleDateString())
      .replace(/\{random_num\}/gi, String(Math.floor(1000 + Math.random() * 9000)))
    setPreviewText(resolved)
  }

  const insertTag = (tag: string) => {
    setTemplate((prev) => prev + tag)
  }

  return (
    <div className="space-y-6">
      {/* Engine Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isPluggerRunning
          ? 'bg-gradient-to-r from-emerald-950/40 to-[#17212b] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : 'bg-[#17212b] border-[#242f3d]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              isPluggerRunning ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-[#242f3d] text-gray-400'
            }`}>
              {isPluggerRunning ? '24/7' : 'OFF'}
            </div>
            {isPluggerRunning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>Auto-Plugger Broadcaster</span>
              {isPluggerRunning && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Broadcasting Active
                </span>
              )}
            </h2>
            <p className="text-xs text-[#708499]">
              {isPluggerRunning
                ? `Running 24/7 loop: broadcast to ${settings.targetGroupIds.length} groups every ~${settings.intervalMinutes}m with anti-ban jitter.`
                : 'Plugger engine is paused. Configure intervals and target groups below then click Start.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onToggle(!isPluggerRunning)}
            disabled={!isAuthorized || settings.targetGroupIds.length === 0}
            className={`px-6 py-3 rounded-xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
              isPluggerRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isPluggerRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Auto-Plugger</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start 24/7 Auto-Plugger</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isAuthorized && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Please connect and authenticate your Telegram account in the Account panel above before starting the auto-plugger.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Intervals */}
        <div className="space-y-6">
          <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Clock className="w-4 h-4 text-[#24A1DE]" />
              <h3>Broadcast Interval</h3>
            </div>
            <p className="text-xs text-[#708499]">
              How often the bot should complete a full broadcast cycle through all your groups:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Every 1 Hr', val: 60 },
                { label: 'Every 2 Hrs', val: 120 },
                { label: 'Every 3 Hrs', val: 180 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setIntervalMin(item.val)
                    onUpdate({ intervalMinutes: item.val })
                  }}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    intervalMin === item.val
                      ? 'bg-[#24A1DE] border-[#24A1DE] text-white shadow-sm'
                      : 'bg-[#0e1621] border-[#242f3d] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] text-[#708499] block mb-1">Custom Minutes:</label>
              <input
                type="number"
                min="10"
                max="1440"
                value={intervalMin}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 60
                  setIntervalMin(val)
                  onUpdate({ intervalMinutes: val })
                }}
                className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#24A1DE]"
              />
            </div>
          </div>

          {/* Anti-Ban & Jitter Settings */}
          <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Shuffle className="w-4 h-4 text-emerald-400" />
              <h3>Anti-Ban Jitter & Human Delays</h3>
            </div>
            <p className="text-xs text-[#708499]">
              Randomized delays between individual groups so Telegram will not detect automated spam bots:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#708499] block mb-1">Min Delay (Sec)</label>
                <input
                  type="number"
                  min="5"
                  value={minDelay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 15
                    setMinDelay(val)
                    onUpdate({ minDelaySec: val })
                  }}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#24A1DE]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#708499] block mb-1">Max Delay (Sec)</label>
                <input
                  type="number"
                  min="10"
                  value={maxDelay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 45
                    setMaxDelay(val)
                    onUpdate({ maxDelaySec: val })
                  }}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#24A1DE]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#0e1621] rounded-xl border border-[#242f3d] text-[11px] text-gray-400">
              💡 The bot pauses a random duration between <strong className="text-white">{minDelay}s</strong> and <strong className="text-white">{maxDelay}s</strong> after every sent message.
            </div>
          </div>

          {/* Target Groups Picker */}
          <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <Users className="w-4 h-4 text-purple-400" />
                <h3>Target Groups</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                {settings.targetGroupIds.length} Active
              </span>
            </div>
            <p className="text-xs text-[#708499]">
              Choose which of your joined channels and groups will receive your marketing plugs.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 bg-[#242f3d] hover:bg-[#2b394a] text-white text-xs font-medium rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Target Groups ({settings.targetGroupIds.length})</span>
            </button>
          </div>
        </div>

        {/* Right Column (2 cols wide): Spintax Message Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3>Spintax Marketing Message</h3>
              </div>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-[#24A1DE] hover:bg-[#1d8bc0] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Save Template
              </button>
            </div>

            <p className="text-xs text-[#708499]">
              Use <code className="text-amber-300 font-mono">&#123;option1|option2|option3&#125;</code> to generate randomized variations on every post, bypassing Telegram spam filters.
            </p>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-gray-400 self-center">Insert Tags:</span>
              {[
                '{group_name}',
                '{Hello|Hey|Hi}',
                '{check out|discover|explore}',
                '{time}',
                '{random_num}',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertTag(` ${tag}`)}
                  className="px-2.5 py-1 bg-[#0e1621] hover:bg-[#242f3d] text-gray-300 rounded-md border border-[#242f3d] font-mono"
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={7}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="{Hey|Hello|Hi} everyone! Check out our {latest|new} service at https://..."
              className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl p-3.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#24A1DE] leading-relaxed resize-y"
            />

            {/* Test Spintax Preview */}
            <div className="pt-2 border-t border-[#242f3d]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#24A1DE]" />
                  <span>Real-time Spintax Preview</span>
                </span>
                <button
                  onClick={generatePreview}
                  className="text-xs text-[#24A1DE] hover:underline flex items-center space-x-1"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Spin Again</span>
                </button>
              </div>

              <div className="p-3.5 bg-[#0e1621] border border-[#242f3d] rounded-xl text-xs text-emerald-300 font-sans whitespace-pre-wrap min-h-[50px]">
                {previewText || (
                  <span className="text-gray-600 italic">Click "Spin Again" to preview a randomized message variation...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Groups Modal */}
      <GroupSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedIds={settings.targetGroupIds}
        onSave={(targetGroupIds) => {
          onUpdate({ targetGroupIds })
        }}
      />
    </div>
  )
}
