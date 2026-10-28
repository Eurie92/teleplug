import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { ConfigStore } from '../src/server/store/configStore.js'

const TEST_FILE = path.resolve(process.cwd(), 'data', 'test-config.json')

describe('ConfigStore', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE)
  })

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE)
  })

  it('should initialize with default settings', () => {
    const store = new ConfigStore(TEST_FILE)
    const config = store.getConfig()
    expect(config.plugger.intervalMinutes).toBe(60)
    expect(config.plugger.minDelaySec).toBe(20)
    expect(config.forwarder.routes).toEqual([])
  })

  it('should update plugger settings', () => {
    const store = new ConfigStore(TEST_FILE)
    store.updatePlugger({ intervalMinutes: 120, minDelaySec: 30 })
    const config = store.getConfig()
    expect(config.plugger.intervalMinutes).toBe(120)
    expect(config.plugger.minDelaySec).toBe(30)

    // Verify it reloads from disk
    const reloadedStore = new ConfigStore(TEST_FILE)
    expect(reloadedStore.getConfig().plugger.intervalMinutes).toBe(120)
  })
})
