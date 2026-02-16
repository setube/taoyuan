export type ThemeKey = 'dark' | 'warm' | 'ink' | 'parchment' | 'zombie' | 'nord'

export interface ThemeDef {
  key: ThemeKey
  name: string
  bg: string
  panel: string
  text: string
  /** Override --color-accent (links, highlights, primary actions, hover). When unset, uses @theme default. */
  accent?: string
  /** Override --color-danger (low HP, warnings, destructive). When unset, uses @theme default. */
  danger?: string
  /** Override --color-success (positive state, success). When unset, uses @theme default. */
  success?: string
  /** Override --color-muted (secondary text, borders). When unset, uses @theme default. */
  muted?: string
}

export const THEMES: ThemeDef[] = [
  { key: 'dark', name: '墨夜', bg: '#1a1a1a', panel: '#2b2d3c', text: '#e8e4d9' },
  { key: 'warm', name: '暖灯', bg: '#2a2318', panel: '#3d3528', text: '#efe6d0' },
  { key: 'ink', name: '水墨', bg: '#f0ece4', panel: '#e0dbd0', text: '#2c2c2c' },
  { key: 'parchment', name: '素笺', bg: '#e8dcc8', panel: '#d8ccb4', text: '#3a3028' },
  /* GitHub/Slack-inspired */
  { key: 'zombie', name: '末日', bg: '#24292e', panel: '#1d4880', text: '#e9f0f7' },
  /* Nord: Polar Night (bg/panel) + Snow Storm (text) + Frost/Aurora for accent/danger/success/muted */
  {
    key: 'nord',
    name: '北境',
    bg: '#2e3440',     /* nord0 Polar Night */
    panel: '#3b4252',  /* nord1 Polar Night */
    text: '#e5e9f0',   /* nord5 Snow Storm */
    accent: '#88c0d0', /* nord8 Frost */
    danger: '#bf616a', /* nord11 Aurora */
    success: '#a3be8c', /* nord14 Aurora */
    muted: '#4c566a',  /* nord3 Polar Night */
  },
]

export const getThemeByKey = (key: ThemeKey): ThemeDef => THEMES.find(t => t.key === key) ?? THEMES[0]!
