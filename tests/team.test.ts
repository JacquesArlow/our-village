import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { team, teamBySlug, teamCategories, getTeamGroups, featuredTeamGroups } from '../data/team'

describe('team profiles', () => {
  it('keeps profile URLs unique and categories consistent with the existing filters', () => {
    expect(new Set(team.map(member => member.slug)).size).toBe(team.length)
    for (const member of team) {
      expect(member.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(teamCategories).toContain(member.category)
    }
  })

  it.each([
    ['lizelle-van-dyk', 'Lizelle van Dyk', 'Management', 'Master’s degree in Early Childhood Intervention'],
    ['sorien-vermeulen', 'Sorien Vermeulen', 'Management', 'Human Resource Management'],
    ['carli-breedt', 'Carli Breedt', 'Management', 'over 12 years of experience'],
    ['prof-anke-de-beer', 'Prof Anke de Beer', 'Emotional & Social Support', 'Master of Theology in Christian Counselling']
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

  it('uses the requested management titles without changing profile URLs or photos', () => {
    expect(teamBySlug('lizelle-van-dyk')!.role).toBe('Practise Manager')
    expect(teamBySlug('sorien-vermeulen')!.role).toBe('Project Manager')
    expect(teamBySlug('carli-breedt')!.role).toBe('Marketing Manager')
    for (const slug of ['lizelle-van-dyk', 'sorien-vermeulen', 'carli-breedt']) {
      expect(teamBySlug(slug)!.photo).toBe('/team/' + slug + '.jpg')
    }
  })

  it('shows owners, managers and then Natasha on both the homepage and full team page', () => {
    const firstSix = ['andrea-swart', 'suzanne-de-beer', 'lizelle-van-dyk', 'sorien-vermeulen', 'carli-breedt', 'dr-natasha-bartie']
    for (const groups of [getTeamGroups(), featuredTeamGroups]) {
      const members = groups.flatMap(group => group.members)
      expect(members.slice(0, 6).map(member => member.slug)).toEqual(firstSix)
      expect(groups[0].members.map(member => member.slug)).toEqual(firstSix.slice(0, 2))
      expect(groups[1].members.map(member => member.slug)).toEqual(firstSix.slice(2, 5))
      expect(new Set(members.map(member => member.slug)).size).toBe(members.length)
    }
    expect(getTeamGroups().flatMap(group => group.members)).toHaveLength(team.length)
    expect(featuredTeamGroups.flatMap(group => group.members)).toHaveLength(11)
  })

  it('preserves medical filters and keeps managers out of practitioner and support categories', () => {
    expect(getTeamGroups('Management')[0].members.map(member => member.slug)).toEqual(['lizelle-van-dyk', 'sorien-vermeulen', 'carli-breedt'])
    expect(getTeamGroups('Medical & Family Care')[0].members.slice(0, 3).map(member => member.slug)).toEqual(['andrea-swart', 'suzanne-de-beer', 'dr-natasha-bartie'])
    expect(getTeamGroups('Support Team')[0].members.map(member => member.slug)).toEqual(['didi-moima', 'beauty-office-assistant'])
    expect(getTeamGroups('Child Development & Learning')[0].members.some(member => member.slug === 'lizelle-van-dyk')).toBe(false)
  })

  it('summarises Prof Anke’s questionnaire without implying clinical psychology credentials', () => {
    const member = teamBySlug('prof-anke-de-beer')!
    expect(member.role).toBe('Digital Wellness Counsellor')
    expect(member.bio).toContain('interdisciplinary research focused on internet addiction')
    expect(member.bio).toContain('trauma counsellor and play therapist')
    expect(member.bio).toContain('Christian faith')
    expect(member.bio).toContain('ReBOOT: TechBalance and Wellness Institute')
    expect(member.bio).toContain('Smart Device Licence')
    expect(member.bio).not.toMatch(/clinical psychologist|registered psychologist/i)
  })
})
