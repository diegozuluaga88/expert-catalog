// F50 · Etapa 10 (P2 Project Builder) · v2 · hook de proyectos.
//
// Un Project es un canvas 2D con productos colocados libremente. Sirve
// como moodboard espacial para presentar visión de un proyecto al
// cliente final (Reception area, Executive office, etc.). No pretende
// ser un CAD · las proporciones son abstractas (canvas 1200×800 units).
//
// Data model · un Project tiene:
//   · id, name, createdAt, updatedAt · metadata
//   · canvas: { width, height, background } · superficie del layout
//   · items: PlacedItem[] · productos colocados con posición/tamaño
//
// PlacedItem:
//   · id · uid del placement (permite mismo producto varias veces)
//   · productId · match contra UNIFIED_PRODUCTS
//   · x, y · esquina superior izquierda
//   · width, height · tamaño del item en el canvas
//   · rotation · 0/90/180/270 (opcional · MVP no lo expone en toolbar)
//
// Persist por-cliente en localStorage. Cuando exista backend, este
// módulo se vuelve wrapper del endpoint real (POST /projects, PUT
// /projects/:id, etc.).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../TenantContext'

export interface PlacedItem {
    id: string
    productId: string
    x: number
    y: number
    width: number
    height: number
    rotation?: number
}

export interface ProjectCanvas {
    width: number
    height: number
    background?: string
}

export interface Project {
    id: string
    name: string
    canvas: ProjectCanvas
    items: PlacedItem[]
    createdAt: string
    updatedAt: string
}

const STORAGE_KEY_PREFIX = 'catalog-projects-'
export const DEFAULT_CANVAS: ProjectCanvas = { width: 1200, height: 800 }
export const DEFAULT_ITEM_SIZE = { width: 140, height: 140 }

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

export interface AddItemInput {
    productId: string
    /** Posición opcional · si no viene, se agrega en el centro del canvas
     *  con offset progresivo para no apilar exacto. */
    x?: number
    y?: number
    width?: number
    height?: number
}

export interface UseProjectsReturn {
    projects: Project[]
    getProject: (id: string) => Project | undefined
    createProject: (name: string, canvas?: ProjectCanvas) => Project
    renameProject: (id: string, name: string) => void
    deleteProject: (id: string) => void
    duplicateProject: (id: string) => Project | null
    addItem: (projectId: string, input: AddItemInput) => PlacedItem | null
    updateItem: (projectId: string, itemId: string, patch: Partial<PlacedItem>) => void
    removeItem: (projectId: string, itemId: string) => void
    clearItems: (projectId: string) => void
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

    const touch = (p: Project): Project => ({ ...p, updatedAt: new Date().toISOString() })

    const createProject = useCallback((name: string, canvas?: ProjectCanvas): Project => {
        const now = new Date().toISOString()
        const project: Project = {
            id: generateId('prj'),
            name: name.trim() || 'Untitled project',
            canvas: canvas ? { ...canvas } : { ...DEFAULT_CANVAS },
            items: [],
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
                items: src.items.map((it) => ({ ...it, id: generateId('itm') })),
                createdAt: now,
                updatedAt: now,
            }
            setProjects((prev) => [copy, ...prev])
            return copy
        },
        [projects],
    )

    const addItem = useCallback(
        (projectId: string, input: AddItemInput): PlacedItem | null => {
            let created: PlacedItem | null = null
            setProjects((prev) =>
                prev.map((p) => {
                    if (p.id !== projectId) return p
                    // Cuando no llega posición, offset progresivo desde el
                    // centro para no apilar en el mismo pixel.
                    const offset = (p.items.length % 8) * 24
                    const w = input.width ?? DEFAULT_ITEM_SIZE.width
                    const h = input.height ?? DEFAULT_ITEM_SIZE.height
                    const item: PlacedItem = {
                        id: generateId('itm'),
                        productId: input.productId,
                        x: input.x ?? Math.round((p.canvas.width - w) / 2 + offset),
                        y: input.y ?? Math.round((p.canvas.height - h) / 2 + offset),
                        width: w,
                        height: h,
                    }
                    created = item
                    return touch({ ...p, items: [...p.items, item] })
                }),
            )
            return created
        },
        [],
    )

    const updateItem = useCallback((projectId: string, itemId: string, patch: Partial<PlacedItem>) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== projectId) return p
                return touch({
                    ...p,
                    items: p.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
                })
            }),
        )
    }, [])

    const removeItem = useCallback((projectId: string, itemId: string) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id !== projectId ? p : touch({ ...p, items: p.items.filter((it) => it.id !== itemId) }),
            ),
        )
    }, [])

    const clearItems = useCallback((projectId: string) => {
        setProjects((prev) =>
            prev.map((p) => (p.id !== projectId ? p : touch({ ...p, items: [] }))),
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
            addItem,
            updateItem,
            removeItem,
            clearItems,
        }),
        [projects, getProject, createProject, renameProject, deleteProject, duplicateProject, addItem, updateItem, removeItem, clearItems],
    )
}

/** Snap a un grid de N units. Devuelve el valor snap-eado. */
export function snapToGrid(value: number, grid: number): number {
    if (grid <= 1) return value
    return Math.round(value / grid) * grid
}
