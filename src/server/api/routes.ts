import { Router, Request, Response } from 'express'
import { configStore } from '../store/configStore.js'
import { telegramManager } from '../telegram/manager.js'
import { logHub } from '../websocket/hub.js'

export const apiRouter = Router()

// System Status
apiRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    ...telegramManager.getStatus(),
    config: configStore.getConfig(),
  })
})

// Update Telegram MTProto Credentials
apiRouter.post('/credentials', async (req: Request, res: Response) => {
  const { apiId, apiHash } = req.body
  if (!apiId || !apiHash) {
    return res.status(400).json({ error: 'apiId and apiHash are required' })
  }

  const numericId = parseInt(apiId, 10)
  configStore.updateCredentials({ apiId: numericId, apiHash })

  try {
    await telegramManager.initClient(numericId, apiHash)
    res.json({ success: true, message: 'Telegram credentials saved and client initialized' })
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) })
  }
})

// Authentication: Request Code
apiRouter.post('/auth/send-code', async (req: Request, res: Response) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'phone is required' })

  try {
    const { phoneCodeHash } = await telegramManager.sendCode(phone)
    res.json({ success: true, phoneCodeHash })
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) })
  }
})

// Authentication: Sign In with OTP
apiRouter.post('/auth/sign-in', async (req: Request, res: Response) => {
  const { phone, code, phoneCodeHash } = req.body
  if (!phone || !code || !phoneCodeHash) {
    return res.status(400).json({ error: 'phone, code, and phoneCodeHash are required' })
  }

  try {
    await telegramManager.signIn(phone, code, phoneCodeHash)
    res.json({ success: true, user: configStore.getConfig().credentials })
  } catch (err: unknown) {
    const errStr = String(err)
    if (errStr.includes('SESSION_PASSWORD_NEEDED') || errStr.includes('2FA')) {
      return res.json({ success: false, requires2FA: true })
    }
    res.status(500).json({ error: errStr })
  }
})

// Authentication: 2FA Password
apiRouter.post('/auth/password', async (req: Request, res: Response) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'password is required' })

  try {
    await telegramManager.checkPassword(password)
    res.json({ success: true, user: configStore.getConfig().credentials })
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) })
  }
})

// Authentication: Logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    await telegramManager.logout()
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) })
  }
})

// Dialogs & Groups
apiRouter.get('/dialogs', async (req: Request, res: Response) => {
  try {
    const dialogs = await telegramManager.fetchDialogs()
    res.json({ success: true, dialogs })
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) })
  }
})

// Auto-Plugger Settings
apiRouter.post('/config/plugger', (req: Request, res: Response) => {
  const updated = configStore.updatePlugger(req.body)
  logHub.info('plugger', 'Plugger settings updated via dashboard')
  res.json({ success: true, plugger: updated })
})

// Auto-Plugger Start/Stop Toggle
apiRouter.post('/plugger/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body
  if (enabled) {
    telegramManager.startPlugger()
  } else {
    telegramManager.stopPlugger()
  }
  res.json({ success: true, isPluggerRunning: enabled })
})

// Auto-Forwarder Settings
apiRouter.post('/config/forwarder', (req: Request, res: Response) => {
  const updated = configStore.updateForwarder(req.body)
  logHub.info('forwarder', 'Forwarder routes updated via dashboard')
  res.json({ success: true, forwarder: updated })
})

// Auto-Forwarder Start/Stop Toggle
apiRouter.post('/forwarder/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body
  if (enabled) {
    telegramManager.startForwarder()
  } else {
    telegramManager.stopForwarder()
  }
  res.json({ success: true, isForwarderRunning: enabled })
})

// Historical Logs
apiRouter.get('/logs', (req: Request, res: Response) => {
  res.json({ logs: logHub.getHistory() })
})
