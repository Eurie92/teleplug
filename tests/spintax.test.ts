import { describe, it, expect } from 'vitest'
import { parseSpintax } from '../src/server/utils/spintax.js'

describe('Spintax Processor', () => {
  it('should pick one of the options in simple spintax', () => {
    const template = '{Hello|Hi|Hey} world!'
    const result = parseSpintax(template)
    expect(['Hello world!', 'Hi world!', 'Hey world!']).toContain(result)
  })

  it('should resolve nested spintax', () => {
    const template = '{Hello {friend|partner}|Welcome}'
    const valid = [
      'Hello friend',
      'Hello partner',
      'Welcome',
    ]
    const result = parseSpintax(template)
    expect(valid).toContain(result)
  })

  it('should substitute dynamic tags', () => {
    const template = 'Hello to {group_name}!'
    const result = parseSpintax(template, { group_name: 'Crypto Traders' })
    expect(result).toBe('Hello to Crypto Traders!')
  })

  it('should return empty string for empty input', () => {
    expect(parseSpintax('')).toBe('')
  })
})
