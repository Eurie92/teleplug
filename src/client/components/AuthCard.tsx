import React, { useState } from 'react'
import { Shield, Key, Phone, CheckCircle, LogOut, Loader2, Lock } from 'lucide-react'

interface AuthCardProps {
  credentials: {
    apiId: number | null
    apiHash: string | null
    isAuthorized: boolean
    userName: string | null
    userId: number | null
  }
  onRefresh: () => void
}

export const AuthCard: React.FC<AuthCardProps> = ({ credentials, onRefresh }) => {
  const [step, setStep] = useState<'creds' | 'phone' | 'otp' | '2fa'>(
    credentials.isAuthorized ? 'creds' : credentials.apiId ? 'phone' : 'creds'
  )
  const [apiId, setApiId] = useState(credentials.apiId ? String(credentials.apiId) : '')
  const [apiHash, setApiHash] = useState(credentials.apiHash || '')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password2FA, setPassword2FA] = useState('')
  const [phoneCodeHash, setPhoneCodeHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveCreds = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId, apiHash }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save credentials')
      setStep('phone')
      onRefresh()
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!phone) {
      setError('Please enter your phone number (+123456789)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setPhoneCodeHash(data.phoneCodeHash)
      setStep('otp')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode, phoneCodeHash }),
      })
      const data = await res.json()
      if (data.requires2FA) {
        setStep('2fa')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Sign-in failed')
      onRefresh()
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCheck2FA = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password2FA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid 2FA password')
      onRefresh()
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect this Telegram account?')) return
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      onRefresh()
      setStep('creds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#17212b] border border-[#242f3d] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-[#242f3d]">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${credentials.isAuthorized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Telegram Account Session</h2>
            <p className="text-xs text-[#708499]">
              {credentials.isAuthorized
                ? `Connected as @${credentials.userName || 'Authorized User'}`
                : 'Not authenticated with Telegram MTProto'}
            </p>
          </div>
        </div>

        {credentials.isAuthorized ? (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Action Required
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">
          {error}
        </div>
      )}

      {/* When Authorized */}
      {credentials.isAuthorized ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0e1621] p-3 rounded-lg border border-[#242f3d]">
            <span className="text-[#708499] block mb-1">Telegram User:</span>
            <span className="font-semibold text-emerald-400">@{credentials.userName || 'Account'}</span>
          </div>
          <div className="bg-[#0e1621] p-3 rounded-lg border border-[#242f3d]">
            <span className="text-[#708499] block mb-1">User ID:</span>
            <span className="font-mono text-gray-200">{credentials.userId || 'N/A'}</span>
          </div>
        </div>
      ) : (
        /* Login Wizard Steps */
        <div className="mt-4 space-y-4">
          {/* Step 1: API ID & Hash */}
          {step === 'creds' && (
            <div className="space-y-3 text-xs">
              <p className="text-gray-300 text-xs">
                Enter your Telegram API credentials from{' '}
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#24A1DE] underline hover:text-sky-300"
                >
                  my.telegram.org
                </a>
                :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#708499] block mb-1">API ID (Numeric)</label>
                  <input
                    type="number"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full bg-[#0e1621] border border-[#242f3d] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                  />
                </div>
                <div>
                  <label className="text-[#708499] block mb-1">API Hash</label>
                  <input
                    type="text"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    placeholder="e.g. 9b7a6c5d..."
                    className="w-full bg-[#0e1621] border border-[#242f3d] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveCreds}
                disabled={loading || !apiId || !apiHash}
                className="w-full mt-2 py-2.5 rounded-lg bg-[#24A1DE] hover:bg-[#1d8bc0] text-white font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Save Credentials & Continue</span>
              </button>
            </div>
          )}

          {/* Step 2: Phone Input */}
          {step === 'phone' && (
            <div className="space-y-3 text-xs">
              <p className="text-gray-300">Enter your Telegram phone number with international country code:</p>
              <div>
                <label className="text-[#708499] block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+639123456789 or +12025550123"
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setStep('creds')}
                  className="px-4 py-2 rounded-lg bg-[#242f3d] text-gray-300 hover:bg-[#2b394a]"
                >
                  Back
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={loading || !phone}
                  className="flex-1 py-2 rounded-lg bg-[#24A1DE] hover:bg-[#1d8bc0] text-white font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  <span>Request Telegram OTP Code</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Enter OTP */}
          {step === 'otp' && (
            <div className="space-y-3 text-xs">
              <p className="text-gray-300">
                Telegram sent a verification code to your Telegram app. Enter the code below:
              </p>
              <div>
                <label className="text-[#708499] block mb-1">Login OTP Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 58392"
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-lg placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>
              <button
                onClick={handleSignIn}
                disabled={loading || !otpCode}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Verify & Login</span>
              </button>
            </div>
          )}

          {/* Step 4: 2FA Password */}
          {step === '2fa' && (
            <div className="space-y-3 text-xs">
              <p className="text-amber-300">Two-Step Verification (2FA) is enabled on this account. Enter your cloud password:</p>
              <div>
                <label className="text-[#708499] block mb-1">2FA Password</label>
                <input
                  type="password"
                  value={password2FA}
                  onChange={(e) => setPassword2FA(e.target.value)}
                  placeholder="Enter 2FA password"
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#24A1DE]"
                />
              </div>
              <button
                onClick={handleCheck2FA}
                disabled={loading || !password2FA}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Submit 2FA Password</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
