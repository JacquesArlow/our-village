import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { team, teamBySlug, teamCategories } from '../data/team'

describe('team profiles', () => {
  it('keeps profile URLs unique and categories consistent with the existing filters', () => {
    expect(new Set(team.map(member => member.slug)).size).toBe(team.length)
    for (const member of team) {
      expect(member.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(teamCategories).toContain(member.category)
    }
  })

  it.each([
    ['lizelle-van-dyk', 'Lizelle van Dyk', 'Child Development & Learning', 'Master’s degree in Early Childhood Intervention'],
    ['sorien-vermeulen', 'Sorien Vermeulen', 'Support Team', 'Human Resource Management'],
    ['carli-breedt', 'Carli Breedt', 'Support Team', 'over 12 years of experience']
  ])('publishes %s with the supplied portrait and a matching card and biography', (slug, name, category, qualification) => {
    const member = teamBySlug(slug)!
    expect(member).toBeDefined()
    expect(member.name).toBe(name)
    expect(member.category).toBe(category)
    expect(member.bio).toContain(qualification)
    expect(member.tagline.length).toBeGreaterThan(30)
    expect(member.tagline.length).toBeLessThan(150)
    expect(member.bio.length).toBeGreaterThan(300)
    expect(member.owner).toBeUndefined()
    expect(member.bookable).toBeUndefined()
    const portrait = new URL('../public' + member.photo, import.meta.url)
    expect(existsSync(portrait)).toBe(true)
    expect([...readFileSync(portrait).subarray(0, 2)]).toEqual([0xff, 0xd8])
  })

  it('retains the personal values and international experience from the introductions', () => {
    expect(teamBySlug('lizelle-van-dyk')!.bio).toContain('South Africa and the United Kingdom')
    expect(teamBySlug('lizelle-van-dyk')!.bio).toContain('almost 30 years')
    expect(teamBySlug('sorien-vermeulen')!.bio).toContain('daughter of the King')
    expect(teamBySlug('sorien-vermeulen')!.bio).toContain('mother of two')
    expect(teamBySlug('carli-breedt')!.role).toBe('Marketing Manager')
    expect(teamBySlug('carli-breedt')!.bio).toContain('Grounded in faith')
  })
})
