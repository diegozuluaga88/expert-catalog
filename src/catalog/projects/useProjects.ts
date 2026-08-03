// F50 · Etapa 10 · v2 · REWRITE (list-based) · Diego ask ·
// descartar el canvas free-form (SVG drag-drop) por overhead técnico
// innecesario para el DS. Nuevo shape: Project = jerarquía
// rooms > zones > items con qty.
//
// Ideal para plan de proyecto tipo Bill of Quantities: dealer arma un
// proyecto declarando qué rooms hay ("Reception", "Executive Office"),
// dentro de cada room qué zones ("Waiting area", "Meeting corner") y
// dentro de cada zone qué productos con qty. Después se exporta como
// PDF/CSV al cliente o al fabricante.
//
// Persist por-cliente en localStorage. Cuando exista backend, el hook
// se vuelve wrapper del endpoint (POST/PUT /projects) sin cambio de
// signature.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../TenantContext'

export interface ProjectItem {
    id: string
    productId: string
    qty: number
    notes?: string
    addedAt: string
}

export interface Zone {
    id: string
    name: string
    items: ProjectItem[]
}

export interface Room {
    id: string
    name: string
    zones: Zone[]
}

export interface Project {
    id: string
    name: string
    rooms: Room[]
    createdAt: string
    updatedAt: string
}

const STORAGE_KEY_PREFIX = 'catalog-projects-v2-'

function loadProjects(tenantSlug: string): Project[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as Project[]
    } catch {
        return []
    }
}

function saveProjects(tenantSlug: string, projects: Project[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(projects))
    } catch {
        /* noop */
    }
}

function generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function touch(p: Project): Project {
    return { ...p, updatedAt: new Date().toISOString() }
}

/** Total de items (sumando qty) de un proyecto entero. */
export function projectTotalUnits(project: Project): number {
    let total = 0
    for (const room of project.rooms) {
        for (const zone of room.zones) {
            for (const item of zone.items) {
                total += item.qty
            }
        }
    }
    return total
}

/** Cantidad de items distintos (líneas) en el proyecto. */
export function projectTotalLines(project: Project): number {
    let total = 0
    for (const room of project.rooms) {
        for (const zone of room.zones) {
            total += zone.items.length
        }
    }
    return total
}

export interface UseProjectsReturn {
    projects: Project[]
    getProject: (id: string) => Project | undefined
    createProject: (name: string) => Project
    renameProject: (id: string, name: string) => void
    deleteProject: (id: string) => void
    duplicateProject: (id: string) => Project | null

    addRoom: (projectId: string, name: string) => Room | null
    renameRoom: (projectId: string, roomId: string, name: string) => void
    removeRoom: (projectId: string, roomId: string) => void

    addZone: (projectId: string, roomId: string, name: string) => Zone | null
    renameZone: (projectId: string, roomId: string, zoneId: string, name: string) => void
    removeZone: (projectId: string, roomId: string, zoneId: string) => void

    addItem: (projectId: string, roomId: string, zoneId: string, productId: string, qty?: number) => ProjectItem | null
    updateItem: (projectId: string, itemId: string, patch: Partial<Pick<ProjectItem, 'qty' | 'notes'>>) => void
    removeItem: (projectId: string, itemId: string) => void
    /** Mueve un item existente a otra zone/room. Si la zone destino ya
     *  tiene un item con el mismo productId, mergea qty al existente y
     *  devuelve { merged: true, targetItemId }. Si no, devuelve
     *  { merged: false, targetItemId: itemId } (mismo id, cambia de bucket). */
    moveItem: (projectId: string, itemId: string, targetRoomId: string, targetZoneId: string) => { merged: boolean; targetItemId: string } | null
}

export function useProjects(): UseProjectsReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [projects, setProjects] = useState<Project[]>(() => loadProjects(tenantSlug))

    useEffect(() => {
        setProjects(loadProjects(tenantSlug))
    }, [tenantSlug])

    useEffect(() => {
        saveProjects(tenantSlug, projects)
    }, [tenantSlug, projects])

    const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects])

    const createProject = useCallback((name: string): Project => {
        const now = new Date().toISOString()
        // Seed con una room + zone default para no arrancar en un empty
        // absoluto (el user puede renombrarlas o borrarlas).
        const defaultZone: Zone = { id: generateId('zn'), name: 'Default', items: [] }
        const defaultRoom: Room = { id: generateId('rm'), name: 'Room 1', zones: [defaultZone] }
        const project: Project = {
            id: generateId('prj'),
            name: name.trim() || 'Untitled project',
            rooms: [defaultRoom],
            createdAt: now,
            updatedAt: now,
        }
        setProjects((prev) => [project, ...prev])
        return project
    }, [])

    const renameProject = useCallback((id: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        setProjects((prev) => prev.map((p) => (p.id === id ? touch({ ...p, name: trimmed }) : p)))
    }, [])

    const deleteProject = useCallback((id: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== id))
    }, [])

    const duplicateProject = useCallback(
        (id: string): Project | null => {
            const src = projects.find((p) => p.id === id)
            if (!src) return null
            const now = new Date().toISOString()
            const copy: Project = {
                ...src,
                id: generateId('prj'),
                name: `${src.name} copy`,
                rooms: src.rooms.map((r) => ({
                    ...r,
                    id: generateId('rm'),
                    zones: r.zones.map((z) => ({
                        ...z,
                        id: generateId('zn'),
                        items: z.items.map((it) => ({ ...it, id: generateId('it') })),
                    })),
                })),
                createdAt: now,
                updatedAt: now,
            }
            setProjects((prev) => [copy, ...prev])
            return copy
        },
        [projects],
    )

    const addRoom = useCallback((projectId: string, name: string): Room | null => {
        const trimmed = name.trim()
        if (!trimmed) return null
        let created: Room | null = null
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                const newRoom: Room = {
                    id: generateId('rm'),
                    name: trimmed,
                    zones: [{ id: generateId('zn'), name: 'Default', items: [] }],
                }
                created = newRoom
                return touch({ ...p, rooms: [...p.rooms, newRoom] })
            }),
        )
        return created
    }, [])

    const renameRoom = useCallback((projectId: string, roomId: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, name: trimmed } : r)),
                })
            }),
        )
    }, [])

    const removeRoom = useCallback((projectId: string, roomId: string) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({ ...p, rooms: p.rooms.filter((r) => r.id !== roomId) })
            }),
        )
    }, [])

    const addZone = useCallback((projectId: string, roomId: string, name: string): Zone | null => {
        const trimmed = name.trim()
        if (!trimmed) return null
        let created: Zone | null = null
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    rooms: p.rooms.map((r) => {
                        if (r.id !== roomId) return r
                        const newZone: Zone = { id: generateId('zn'), name: trimmed, items: [] }
                        created = newZone
                        return { ...r, zones: [...r.zones, newZone] }
                    }),
                })
            }),
        )
        return created
    }, [])

    const renameZone = useCallback((projectId: string, roomId: string, zoneId: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    rooms: p.rooms.map((r) => {
                        if (r.id !== roomId) return r
                        return {
                            ...r,
                            zones: r.zones.map((z) => (z.id === zoneId ? { ...z, name: trimmed } : z)),
                        }
                    }),
                })
            }),
        )
    }, [])

    const removeZone = useCallback((projectId: string, roomId: string, zoneId: string) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    rooms: p.rooms.map((r) => {
                        if (r.id !== roomId) return r
                        return { ...r, zones: r.zones.filter((z) => z.id !== zoneId) }
                    }),
                })
            }),
        )
    }, [])

    const addItem = useCallback(
        (projectId: string, roomId: string, zoneId: string, productId: string, qty = 1): ProjectItem | null => {
            let created: ProjectItem | null = null
            setProjects((prev) =>
                prev.map((p) => {
                    if (p.id !== projectId) return p
                    return touch({
                        ...p,
                        rooms: p.rooms.map((r) => {
                            if (r.id !== roomId) return r
                            return {
                                ...r,
                                zones: r.zones.map((z) => {
                                    if (z.id !== zoneId) return z
                                    // Si el producto ya existe en la zone, incrementa qty en vez de duplicar.
                                    const existing = z.items.find((it) => it.productId === productId)
                                    if (existing) {
                                        created = { ...existing, qty: existing.qty + qty }
                                        return {
                                            ...z,
                                            items: z.items.map((it) =>
                                                it.id === existing.id ? { ...it, qty: it.qty + qty } : it,
                                            ),
                                        }
                                    }
                                    const newItem: ProjectItem = {
                                        id: generateId('it'),
                                        productId,
                                        qty,
                                        addedAt: new Date().toISOString(),
                                    }
                                    created = newItem
                                    return { ...z, items: [...z.items, newItem] }
                                }),
                            }
                        }),
                    })
                }),
            )
            return created
        },
        [],
    )

    const updateItem = useCallback(
        (projectId: string, itemId: string, patch: Partial<Pick<ProjectItem, 'qty' | 'notes'>>) => {
            setProjects((prev) =>
                prev.map((p) => {
                    if (p.id !== projectId) return p
                    return touch({
                        ...p,
                        rooms: p.rooms.map((r) => ({
                            ...r,
                            zones: r.zones.map((z) => ({
                                ...z,
                                items: z.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
                            })),
                        })),
                    })
                }),
            )
        },
        [],
    )

    const moveItem = useCallback(
        (projectId: string, itemId: string, targetRoomId: string, targetZoneId: string): { merged: boolean; targetItemId: string } | null => {
            let result: { merged: boolean; targetItemId: string } | null = null
            setProjects((prev) =>
                prev.map((p) => {
                    if (p.id !== projectId) return p
                    // Encontrar el item source y su ubicación actual
                    let source: ProjectItem | null = null
                    let sourceRoomId = ''
                    let sourceZoneId = ''
                    for (const room of p.rooms) {
                        for (const zone of room.zones) {
                            const found = zone.items.find((it) => it.id === itemId)
                            if (found) {
                                source = found
                                sourceRoomId = room.id
                                sourceZoneId = zone.id
                                break
                            }
                        }
                        if (source) break
                    }
                    if (!source) return p
                    // No-op si ya está ahí
                    if (sourceRoomId === targetRoomId && sourceZoneId === targetZoneId) {
                        result = { merged: false, targetItemId: itemId }
                        return p
                    }
                    // Chequear si el target ya tiene un item con el mismo productId (merge)
                    const targetRoom = p.rooms.find((r) => r.id === targetRoomId)
                    const targetZone = targetRoom?.zones.find((z) => z.id === targetZoneId)
                    if (!targetRoom || !targetZone) return p
                    const existingInTarget = targetZone.items.find((it) => it.productId === source!.productId)
                    if (existingInTarget) {
                        // MERGE: suma qty al existente + remove source
                        result = { merged: true, targetItemId: existingInTarget.id }
                        return touch({
                            ...p,
                            rooms: p.rooms.map((r) => ({
                                ...r,
                                zones: r.zones.map((z) => {
                                    if (z.id === sourceZoneId) {
                                        return { ...z, items: z.items.filter((it) => it.id !== itemId) }
                                    }
                                    if (z.id === targetZoneId) {
                                        return {
                                            ...z,
                                            items: z.items.map((it) =>
                                                it.id === existingInTarget.id ? { ...it, qty: it.qty + source!.qty } : it,
                                            ),
                                        }
                                    }
                                    return z
                                }),
                            })),
                        })
                    }
                    // MOVE: mismo item, cambia de bucket
                    result = { merged: false, targetItemId: itemId }
                    return touch({
                        ...p,
                        rooms: p.rooms.map((r) => ({
                            ...r,
                            zones: r.zones.map((z) => {
                                if (z.id === sourceZoneId) {
                                    return { ...z, items: z.items.filter((it) => it.id !== itemId) }
                                }
                                if (z.id === targetZoneId) {
                                    return { ...z, items: [...z.items, source!] }
                                }
                                return z
                            }),
                        })),
                    })
                }),
            )
            return result
        },
        [],
    )

    const removeItem = useCallback((projectId: string, itemId: string) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    rooms: p.rooms.map((r) => ({
                        ...r,
                        zones: r.zones.map((z) => ({
                            ...z,
                            items: z.items.filter((it) => it.id !== itemId),
                        })),
                    })),
                })
            }),
        )
    }, [])

    return useMemo(
        () => ({
            projects,
            getProject,
            createProject,
            renameProject,
            deleteProject,
            duplicateProject,
            addRoom,
            renameRoom,
            removeRoom,
            addZone,
            renameZone,
            removeZone,
            addItem,
            updateItem,
            removeItem,
            moveItem,
        }),
        [
            projects,
            getProject,
            createProject,
            renameProject,
            deleteProject,
            duplicateProject,
            addRoom,
            renameRoom,
            removeRoom,
            addZone,
            renameZone,
            removeZone,
            addItem,
            updateItem,
            removeItem,
            moveItem,
        ],
    )
}
