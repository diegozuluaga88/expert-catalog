// Phase 3 Fix #10 — User company profile para autofill del buyer info.
// AuthContext expone solo email + full_name. Esta capa agrega phone, title,
// avatar via lookup por email · sin modificar el AuthContext (no breaking).

export interface UserCompanyProfile {
    email: string
    fullName: string
    title: string
    phone: string
    /** Iniciales para avatar circular cuando no hay imagen */
    initials: string
}

const USER_PROFILES: Record<string, UserCompanyProfile> = {
    'demo@agenticdream.com': {
        email: 'demo@agenticdream.com',
        fullName: 'Demo User',
        title: 'Procurement Manager',
        phone: '+1 (315) 555-0100',
        initials: 'DU',
    },
    'test@goavanto.com': {
        email: 'test@goavanto.com',
        fullName: 'Test User',
        title: 'Operations Lead',
        phone: '+1 (615) 555-0200',
        initials: 'TU',
    },
}

function computeInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 0) return '—'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getUserCompanyProfile(email: string | undefined, fullName: string | undefined): UserCompanyProfile {
    if (email && USER_PROFILES[email]) return USER_PROFILES[email]
    return {
        email: email ?? 'guest@unknown',
        fullName: fullName ?? 'Guest User',
        title: 'Buyer',
        phone: '—',
        initials: computeInitials(fullName ?? 'GU'),
    }
}
