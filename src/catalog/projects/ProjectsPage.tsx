// F50 · Etapa 10 (P2 Project Builder) · v2 · página raíz del sub-tab
// "My Projects". Alterna entre:
//   · Lista de proyectos (grid de cards con thumbnail del canvas)
//   · Editor del canvas para un proyecto específico
//
// Persist local vía useProjects. Sin backend.

import { useState } from 'react'
import { Plus, ArrowLeft, Trash2, Copy, Pencil, FolderKanban } from 'lucide-react'
import { Button, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
import { useProjects, type Project } from './useProjects'
import ProjectCanvas from './ProjectCanvas'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import type { Product } from '../types'

export default function ProjectsPage() {
    const {
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
    } = useProjects()

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
    const activeProject = activeProjectId ? getProject(activeProjectId) : undefined

    const handleCreate = () => {
        const name = window.prompt('New project name')
        if (name && name.trim()) {
            const created = createProject(name)
            setActiveProjectId(created.id)
        }
    }

    if (activeProject) {
        return (
            <ProjectCanvas
                project={activeProject}
                allProducts={UNIFIED_PRODUCTS}
                onBack={() => setActiveProjectId(null)}
                onAddItem={(input) => addItem(activeProject.id, input)}
                onUpdateItem={(itemId, patch) => updateItem(activeProject.id, itemId, patch)}
                onRemoveItem={(itemId) => removeItem(activeProject.id, itemId)}
                onClearItems={() => clearItems(activeProject.id)}
                onRename={(name) => renameProject(activeProject.id, name)}
            />
        )
    }

    return (
        <div className="mx-auto max-w-7xl">
            <header className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Build spatial moodboards for your clients · drag products from the catalog to a canvas.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    New project
                </Button>
            </header>

            {projects.length === 0 ? (
                <EmptyState>
                    <EmptyStateIcon>
                        <FolderKanban className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </EmptyStateIcon>
                    <EmptyStateTitle>No projects yet</EmptyStateTitle>
                    <EmptyStateDescription>
                        Create your first project to start placing products in a free canvas layout.
                    </EmptyStateDescription>
                </EmptyState>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {projects.map((p) => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            onOpen={() => setActiveProjectId(p.id)}
                            onRename={() => {
                                const name = window.prompt('Rename project', p.name)
                                if (name && name.trim()) renameProject(p.id, name)
                            }}
                            onDelete={() => {
                                if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) {
                                    deleteProject(p.id)
                                }
                            }}
                            onDuplicate={() => {
                                const copy = duplicateProject(p.id)
                                if (copy) setActiveProjectId(copy.id)
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface ProjectCardProps {
    project: Project
    onOpen: () => void
    onRename: () => void
    onDelete: () => void
    onDuplicate: () => void
}

function ProjectCard({ project, onOpen, onRename, onDelete, onDuplicate }: ProjectCardProps) {
    const { canvas, items, updatedAt } = project
    // Thumbnail: proyecta los items del canvas a un mini-SVG proporcional.
    const thumbAspect = canvas.width / canvas.height
    const thumbHeight = 160
    const thumbWidth = Math.round(thumbHeight * thumbAspect)
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all">
            <button
                type="button"
                onClick={onOpen}
                className="relative block w-full overflow-hidden bg-muted"
                style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
                aria-label={`Open project ${project.name}`}
            >
                <svg
                    viewBox={`0 0 ${canvas.width} ${canvas.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="h-full w-full"
                >
                    <rect width={canvas.width} height={canvas.height} fill="var(--color-muted, #f4f4f5)" />
                    {items.map((it) => {
                        const product = UNIFIED_PRODUCTS.find((p) => p.id === it.productId)
                        return (
                            <g key={it.id} transform={`translate(${it.x} ${it.y})`}>
                                <rect
                                    width={it.width}
                                    height={it.height}
                                    fill="var(--color-card, #fff)"
                                    stroke="var(--color-border, #e4e4e7)"
                                    strokeWidth={2}
                                    rx={8}
                                />
                                {product && (
                                    <image
                                        href={product.images[0]}
                                        x={0}
                                        y={0}
                                        width={it.width}
                                        height={it.height}
                                        preserveAspectRatio="xMidYMid slice"
                                    />
                                )}
                            </g>
                        )
                    })}
                </svg>
            </button>
            <div className="flex flex-col gap-1 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {items.length} {items.length === 1 ? 'item' : 'items'} · updated {new Date(updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconButton onClick={onRename} label="Rename">
                            <Pencil className="h-3 w-3" />
                        </IconButton>
                        <IconButton onClick={onDuplicate} label="Duplicate">
                            <Copy className="h-3 w-3" />
                        </IconButton>
                        <IconButton onClick={onDelete} label="Delete" danger>
                            <Trash2 className="h-3 w-3" />
                        </IconButton>
                    </div>
                </div>
            </div>
        </article>
    )
}

function IconButton({
    onClick,
    label,
    danger,
    children,
}: {
    onClick: () => void
    label: string
    danger?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors ${
                danger ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-muted hover:text-foreground'
            }`}
        >
            {children}
        </button>
    )
}
