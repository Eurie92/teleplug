import React, { useState, useEffect } from 'react'
import { X, Search, CheckSquare, Square, RefreshCw, Loader2, Users, AlertCircle } from 'lucide-react'
import { TelegramGroup } from '../../server/types/index.js'

interface GroupSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onSave: (targetGroupIds: string[]) => void
}

export const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  onSave,
}) => {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds))

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedIds))
      fetchGroups()
    }
  }, [isOpen, selectedIds])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dialogs')
      const data = await res.json()
      if (data.dialogs) {
        setGroups(data.dialogs)
      }
    } catch (err) {
      console.error('Failed to fetch dialogs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const filteredGroups = groups.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    (g.username && g.username.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleGroup = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const selectAllWritable = () => {
    const next = new Set(selected)
    filteredGroups.forEach((g) => {
      if (g.canSendMessages) next.add(g.id)
    })
    setSelected(next)
  }

  const deselectAll = () => {
    setSelected(new Set())
  }

  const handleApply = () => {
    onSave(Array.from(selected))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#17212b] border border-[#242f3d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#242f3d] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#24A1DE]" />
            <h3 className="text-base font-semibold text-white">Target Groups & Channels</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#24A1DE]/20 text-[#24A1DE] font-medium">
              {selected.size} selected
            </span>
          </div>
          <button onClick={onClose} className="text-[#708499] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-[#242f3d] space-y-3 bg-[#0e1621]">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search groups or channels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#17212b] border border-[#242f3d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#24A1DE]"
              />
            </div>
            <button
              onClick={fetchGroups}
              disabled={loading}
              className="p-2 bg-[#17212b] border border-[#242f3d] hover:bg-[#242f3d] text-gray-300 rounded-lg text-xs flex items-center space-x-1"
              title="Rescan dialogs from Telegram"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-2">
              <button
                onClick={selectAllWritable}
                className="text-[#24A1DE] hover:underline flex items-center space-x-1"
              >
                <span>Select All Writable</span>
              </button>
              <span className="text-gray-600">•</span>
              <button
                onClick={deselectAll}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            </div>
            <span className="text-gray-500">{filteredGroups.length} shown</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#24A1DE]" />
              <p className="text-xs">Scanning Telegram dialogs...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No groups or channels found. Make sure your account has joined groups, or try refreshing.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isChecked = selected.has(group.id)
              return (
                <div
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#24A1DE]/10 border-[#24A1DE]/40 text-white'
                      : 'bg-[#17212b] border-[#242f3d] hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="text-[#24A1DE] flex-shrink-0">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-medium truncate flex items-center space-x-1.5">
                        <span className="truncate">{group.title}</span>
                        {group.username && (
                          <span className="text-[10px] text-gray-500 font-normal">@{group.username}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">ID: {group.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {group.canSendMessages ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Writable
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Read Only</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#242f3d] bg-[#0e1621] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {selected.size} groups selected for auto-plugging
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#242f3d] text-gray-300 hover:bg-[#2b394a] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-[#24A1DE] hover:bg-[#1d8bc0] text-white text-xs font-medium"
            >
              Apply Targets
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
