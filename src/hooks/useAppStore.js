import { create } from 'zustand'
import { updateLocalData, clearLocalData } from '@/services/data'
import { buildSitesForIndustry } from '@/utils/sites'

const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  user:      null,
  userData:  null,
  authReady: false,

  setUser:     user     => set({ user }),
  setUserData: userData => set({ userData }),
  setAuthReady:ready    => set({ authReady: ready }),

  // ── Sites ─────────────────────────────────────────────────
  sites: [],

  setSites: sites => {
    set({ sites })
    updateLocalData({ shortcuts: sites })
  },

  addSite: site => {
    const sites = [...get().sites, site]
    set({ sites })
    updateLocalData({ shortcuts: sites })
  },

  updateSite: (id, patch) => {
    const sites = get().sites.map(s => s.id === id ? { ...s, ...patch } : s)
    set({ sites })
    updateLocalData({ shortcuts: sites })
  },

  removeSite: id => {
    const sites = get().sites.filter(s => s.id !== id)
    set({ sites })
    updateLocalData({ shortcuts: sites })
  },

  toggleQL: id => {
    const sites = get().sites.map(s => s.id === id ? { ...s, ql: !s.ql } : s)
    set({ sites })
    updateLocalData({ shortcuts: sites })
  },

  reorderSites: ordered => {
    set({ sites: ordered })
    updateLocalData({ shortcuts: ordered })
  },

  initSites: (userData) => {
    if (userData.shortcuts && userData.shortcuts.length > 0) {
      // Merge builtins (preserving ql state) with custom sites
      const base    = buildSitesForIndustry(userData.industry || 'general')
      const custom  = userData.shortcuts.filter(s => !s.builtin)
      const merged  = base.map(b => {
        const saved = userData.shortcuts.find(s => s.id === b.id)
        return saved ? { ...b, ql: saved.ql } : b
      })
      set({ sites: [...merged, ...custom] })
    } else {
      set({ sites: buildSitesForIndustry(userData.industry || 'general') })
    }
  },

  // ── History ───────────────────────────────────────────────
  history: [],

  addHistory: entry => {
    const history = [entry, ...get().history.filter(h => h.raw !== entry.raw)].slice(0, 30)
    set({ history })
    try { localStorage.setItem('navix_history', JSON.stringify(history)) } catch {}
  },

  clearHistory: () => {
    set({ history: [] })
    localStorage.removeItem('navix_history')
  },

  loadHistory: () => {
    try {
      const raw = localStorage.getItem('navix_history')
      if (raw) set({ history: JSON.parse(raw) })
    } catch {}
  },

  // ── Preferences ───────────────────────────────────────────
  theme:     't-midnight',
  font:      'f-inter',
  devMode:   false,

  setTheme: theme => {
    set({ theme })
    updateLocalData({ theme })
  },

  setFont: font => {
    set({ font })
    updateLocalData({ font })
  },

  setDevMode: devMode => {
    set({ devMode })
    updateLocalData({ devMode })
  },

  // ── Toast ─────────────────────────────────────────────────
  toast:     null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 2600)
  },

  // ── Sign out ──────────────────────────────────────────────
  resetAll: () => {
    clearLocalData()
    localStorage.removeItem('navix_history')
    set({
      user: null, userData: null, sites: [], history: [],
      theme: 't-midnight', font: 'f-inter', devMode: false,
    })
  },
}))

export default useAppStore
