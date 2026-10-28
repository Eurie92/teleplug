import { describe, it, expect } from 'vitest'
import { getRandomDelay, getJitteredInterval } from '../src/server/utils/jitter.js'

describe('Jitter & Rate-Limiting Helpers', () => {
  it('should generate delay strictly within minSec and maxSec bounds', () => {
    for (let i = 0; i < 50; i++) {
      const delayMs = getRandomDelay(10, 20)
      expect(delayMs).toBeGreaterThanOrEqual(10000)
      expect(delayMs).toBeLessThanOrEqual(20000)
    }
  })

  it('should generate a jittered interval within variance bounds', () => {
    const baseMinutes = 60 // 1 hr = 3,600,000 ms
    const baseMs = 60 * 60 * 1000
    const varianceMs = baseMs * 0.1 // 10% = 360,000 ms

    for (let i = 0; i < 30; i++) {
      const jittered = getJitteredInterval(baseMinutes, 10)
      expect(jittered).toBeGreaterThanOrEqual(baseMs - varianceMs)
      expect(jittered).toBeLessThanOrEqual(baseMs + varianceMs)
    }
  })
})
