export interface TeamMember {
    id: string
    name: string
    initials: string
    role: 'Account Manager' | 'Expert Hub' | 'Admin'
    /** Pseudo-online status — only "me" is treated as online for the demo. */
    online?: boolean
}

// Sentinel for the current logged-in user (shown as "Me" in pickers).
export const CURRENT_USER_ID = 'me'

export const TEAM_MEMBERS: TeamMember[] = [
    { id: 'me', name: 'Demo User', initials: 'DU', role: 'Account Manager', online: true },
    { id: 'sarah', name: 'Sarah Johnson', initials: 'SJ', role: 'Expert Hub' },
    { id: 'marcus', name: 'Marcus Webb', initials: 'MW', role: 'Expert Hub' },
    { id: 'priya', name: 'Priya Shah', initials: 'PS', role: 'Expert Hub' },
    { id: 'daniel', name: 'Daniel Okafor', initials: 'DO', role: 'Expert Hub' },
    { id: 'elena', name: 'Elena Martínez', initials: 'EM', role: 'Account Manager' },
    { id: 'noah', name: 'Noah Fischer', initials: 'NF', role: 'Expert Hub' },
    { id: 'tomas', name: 'Tomás Álvarez', initials: 'TA', role: 'Expert Hub' },
]

export function getTeamMember(id: string | undefined | null): TeamMember | null {
    if (!id) return null
    return TEAM_MEMBERS.find(m => m.id === id) ?? null
}

// Distinct background hue per member so chips/avatars stay visually identifiable
// without depending on a stored value. Pure function of the member id.
const AVATAR_HUES = [
    'from-indigo-500 to-indigo-700',
    'from-emerald-500 to-emerald-700',
    'from-rose-500 to-rose-700',
    'from-amber-500 to-amber-700',
    'from-purple-500 to-purple-700',
    'from-cyan-500 to-cyan-700',
    'from-orange-500 to-orange-700',
    'from-blue-500 to-blue-700',
]

export function avatarGradient(memberId: string): string {
    let hash = 0
    for (let i = 0; i < memberId.length; i++) hash = (hash * 31 + memberId.charCodeAt(i)) >>> 0
    return AVATAR_HUES[hash % AVATAR_HUES.length]
}
