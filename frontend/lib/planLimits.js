export const FREE_MAX_PERSONS = 6
export const PRO_MAX_PERSONS = 20
export const FREE_DAILY_SESSIONS = 99

export function getDailySearchKey() {
  return `tablefor_daily_${new Date().toISOString().slice(0, 10)}`
}

export function getAnonymousDailySearchCount() {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(getDailySearchKey()) || '0', 10)
}

export function incrementAnonymousDailySearchCount() {
  if (typeof window === 'undefined') return
  const key = getDailySearchKey()
  const count = parseInt(localStorage.getItem(key) || '0', 10)
  localStorage.setItem(key, String(count + 1))
}
