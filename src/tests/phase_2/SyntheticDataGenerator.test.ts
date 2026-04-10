import { describe, it, expect } from 'bun:test'
import { SyntheticDataGenerator } from '../../tools/SyntheticDataGenerator.js'

describe('SyntheticDataGenerator', () => {
  it('should generate a deterministic dataset with a seed', () => {
    const gen1 = new SyntheticDataGenerator(123)
    const data1 = gen1.generate(5)

    const gen2 = new SyntheticDataGenerator(123)
    const data2 = gen2.generate(5)

    expect(data1.profiles.length).toBe(5)
    expect(data1.profiles[0].id).toBe(data2.profiles[0].id)
    expect(data1.profiles[0].email).toBe(data2.profiles[0].email)
  })

  it('should generate different data with different seeds', () => {
    const gen1 = new SyntheticDataGenerator(111)
    const data1 = gen1.generate(1)

    const gen2 = new SyntheticDataGenerator(222)
    const data2 = gen2.generate(1)

    expect(data1.profiles[0].email).not.toBe(data2.profiles[0].email)
  })

  it('should produce GDPR-compliant profiles', () => {
    const gen = new SyntheticDataGenerator()
    const data = gen.generate(1)
    const profile = data.profiles[0]

    expect(profile.email).toContain('test.niro.invalid')
    expect(profile.creditCard.number).toMatch(/^0000-/)
    expect(data.metadata.gdprCompliant).toBe(true)
  })

  it('should generate valid SQL insert statements', () => {
    const gen = new SyntheticDataGenerator()
    const data = gen.generate(2)
    const sql = gen.toSQL(data.profiles, 'test_users')

    expect(sql).toContain('INSERT INTO test_users')
    expect(sql).toContain('test.niro.invalid')
    expect(sql.split('\n').filter(l => l.startsWith('INSERT')).length).toBe(2)
  })

  it('should generate valid JSON fixtures', () => {
    const gen = new SyntheticDataGenerator()
    const data = gen.generate(3)
    const json = gen.toJSON(data.profiles)
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(3)
    expect(parsed[0].firstName).toBeDefined()
  })
})
