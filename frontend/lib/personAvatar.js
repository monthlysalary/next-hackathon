/** Distinct avatar colors per person slot (cycles if more than palette length) */
export const PERSON_AVATAR_COLORS = [
  { bg: '#F28155', border: '#F28155', ring: 'rgba(242, 129, 85, 0.35)' },
  { bg: '#8B5CF6', border: '#8B5CF6', ring: 'rgba(139, 92, 246, 0.35)' },
  { bg: '#14B8A6', border: '#14B8A6', ring: 'rgba(20, 184, 166, 0.35)' },
  { bg: '#3B82F6', border: '#3B82F6', ring: 'rgba(59, 130, 246, 0.35)' },
  { bg: '#F43F5E', border: '#F43F5E', ring: 'rgba(244, 63, 94, 0.35)' },
  { bg: '#D97706', border: '#D97706', ring: 'rgba(217, 119, 6, 0.35)' },
  { bg: '#6366F1', border: '#6366F1', ring: 'rgba(99, 102, 241, 0.35)' },
  { bg: '#10B981', border: '#10B981', ring: 'rgba(16, 185, 129, 0.35)' },
]

export function getPersonAvatarColor(index) {
  return PERSON_AVATAR_COLORS[index % PERSON_AVATAR_COLORS.length]
}

export function personInitial(person, index) {
  const letter = person?.name?.trim()?.charAt(0)?.toUpperCase()
  return letter || String(index + 1)
}
