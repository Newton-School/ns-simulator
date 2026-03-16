/**
 * Node Registry Consistency Tests
 *
 * These tests ensure that whenever a new node is added to NODE_REGISTRY,
 * all related config surfaces (themes, icon lookups, compute defaults,
 * type unions, catalog) stay in sync.
 */
import { describe, it, expect } from 'vitest'
import { NODE_REGISTRY, COMPUTE_DEFAULTS } from '@renderer/config/nodeRegistry'
import { THEME_CONFIG } from '@renderer/config/themeConfig'
import { CATALOG_CONFIG } from '@renderer/config/catalogConfig'
import {
  SERVICE_ICON_LOOKUP,
  VPC_ICON_LOOKUP,
  SECURITY_ICON_LOOKUP
} from '@renderer/config/iconLookups'
// ComputeType consistency is checked implicitly via COMPUTE_DEFAULTS keys

// ───────── helpers ─────────

const entries = Object.entries(NODE_REGISTRY)
const byType = (t: string) => entries.filter(([, def]) => def.type === t)

const allCatalogIds = CATALOG_CONFIG.flatMap((cat) => cat.items.map((item) => item.id))

// ───────── tests ─────────

describe('NODE_REGISTRY consistency', () => {
  // 1. id ↔ key match
  it('every entry id matches its object key', () => {
    for (const [key, def] of entries) {
      expect(def.id, `"${key}" has mismatched id "${def.id}"`).toBe(key)
    }
  })

  // 2. theme exists for every lookupKey
  it('every lookupKey has a THEME_CONFIG entry', () => {
    for (const [key, def] of entries) {
      expect(
        THEME_CONFIG[def.lookupKey],
        `"${key}" uses lookupKey "${def.lookupKey}" which is missing from THEME_CONFIG`
      ).toBeDefined()
    }
  })

  // 3. every computeNode has a COMPUTE_DEFAULTS entry
  it('every computeNode lookupKey has a COMPUTE_DEFAULTS entry', () => {
    for (const [key, def] of byType('computeNode')) {
      expect(
        (COMPUTE_DEFAULTS as Record<string, unknown>)[def.lookupKey],
        `computeNode "${key}" (lookupKey "${def.lookupKey}") is missing from COMPUTE_DEFAULTS`
      ).toBeDefined()
    }
  })

  // 4. no orphan COMPUTE_DEFAULTS entries
  it('every COMPUTE_DEFAULTS key maps to a computeNode lookupKey', () => {
    const computeLookupKeys = new Set(byType('computeNode').map(([, d]) => d.lookupKey))
    for (const cdKey of Object.keys(COMPUTE_DEFAULTS)) {
      expect(
        computeLookupKeys.has(cdKey),
        `COMPUTE_DEFAULTS["${cdKey}"] has no matching computeNode`
      ).toBe(true)
    }
  })

  // 5. COMPUTE_DEFAULTS keys match ComputeType union
  it('COMPUTE_DEFAULTS keys are valid ComputeType values', () => {
    for (const [key, def] of byType('computeNode')) {
      const ct = def.defaultData.computeType as string
      expect(
        ct,
        `computeNode "${key}" has computeType "${ct}" in defaultData — make sure ComputeType union includes it`
      ).toBeTruthy()
      expect(
        (COMPUTE_DEFAULTS as Record<string, unknown>)[ct],
        `computeNode "${key}" has computeType "${ct}" which is missing from COMPUTE_DEFAULTS (add to ComputeType union too)`
      ).toBeDefined()
    }
  })

  // 6. serviceNode iconKey → SERVICE_ICON_LOOKUP
  it('every serviceNode iconKey exists in SERVICE_ICON_LOOKUP', () => {
    for (const [key, def] of byType('serviceNode')) {
      const iconKey = def.defaultData.iconKey as string
      expect(
        SERVICE_ICON_LOOKUP[iconKey],
        `serviceNode "${key}" uses iconKey "${iconKey}" which is missing from SERVICE_ICON_LOOKUP`
      ).toBeDefined()
    }
  })

  // 7. vpcNode iconKey → VPC_ICON_LOOKUP
  it('every vpcNode iconKey exists in VPC_ICON_LOOKUP', () => {
    for (const [key, def] of byType('vpcNode')) {
      const iconKey = def.defaultData.iconKey as string
      expect(
        VPC_ICON_LOOKUP[iconKey],
        `vpcNode "${key}" uses iconKey "${iconKey}" which is missing from VPC_ICON_LOOKUP`
      ).toBeDefined()
    }
  })

  // 8. securityNode iconKey → SECURITY_ICON_LOOKUP
  it('every securityNode iconKey exists in SECURITY_ICON_LOOKUP', () => {
    for (const [key, def] of byType('securityNode')) {
      const iconKey = def.defaultData.iconKey as string
      expect(
        SECURITY_ICON_LOOKUP[iconKey],
        `securityNode "${key}" uses iconKey "${iconKey}" which is missing from SECURITY_ICON_LOOKUP`
      ).toBeDefined()
    }
  })

  // 9. no duplicate lookupKeys
  it('no two nodes share the same lookupKey', () => {
    const seen = new Map<string, string>()
    for (const [key, def] of entries) {
      const prev = seen.get(def.lookupKey)
      expect(
        prev,
        `lookupKey "${def.lookupKey}" is used by both "${prev}" and "${key}"`
      ).toBeUndefined()
      seen.set(def.lookupKey, key)
    }
  })

  // 10. every node appears in the catalog
  it('every NODE_REGISTRY entry appears in CATALOG_CONFIG', () => {
    for (const [key] of entries) {
      expect(
        allCatalogIds.includes(key),
        `"${key}" is in NODE_REGISTRY but missing from CATALOG_CONFIG`
      ).toBe(true)
    }
  })

  // 11. non-empty label and subLabel
  it('every node has non-empty label and subLabel', () => {
    for (const [key, def] of entries) {
      expect(def.label, `"${key}" has an empty label`).toBeTruthy()
      expect(def.subLabel, `"${key}" has an empty subLabel`).toBeTruthy()
    }
  })
})
