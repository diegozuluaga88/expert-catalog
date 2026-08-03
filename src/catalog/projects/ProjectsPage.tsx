// F50 · Etapa 10 (rewrite list-based) · v2 · página raíz del sub-tab
// "My Projects". Alterna entre lista de proyectos y detail view.

import { useState } from 'react'
import { Plus, Trash2, Copy, Pencil, FolderKanban, Home } from 'lucide-react'
import { Button, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
import { useProjects, projectTotalUnits, projectTotalLines, type Project } from './useProjects'
import ProjectDetailView from './ProjectDetailView'
import CreateProjectModal from './CreateProjectModal'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import { useDialogs } from '../../components/dialogs/DialogsContext'

export default function ProjectsPage() {
    const {
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
    } = useProjects()

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const activeProject = activeProjectId ? getProject(activeProjectId) : undefined
    const { prompt, confirm } = useDialogs()

    if (activeProject) {
        return (
            <ProjectDetailView
                project={activeProject}
                allProducts={UNIFIED_PRODUCTS}
                onBack={() => setActiveProjectId(null)}
                onRename={(name) => renameProject(activeProject.id, name)}
                onAddRoom={(name) => addRoom(activeProject.id, name)}
                onRenameRoom={(roomId, name) => renameRoom(activeProject.id, roomId, name)}
                onRemoveRoom={(roomId) => removeRoom(activeProject.id, roomId)}
                onAddZone={(roomId, name) => addZone(activeProject.id, roomId, name)}
                onRenameZone={(roomId, zoneId, name) => renameZone(activeProject.id, roomId, zoneId, name)}
                onRemoveZone={(roomId, zoneId) => removeZone(activeProject.id, roomId, zoneId)}
                onAddItem={(roomId, zoneId, productId, qty) => addItem(activeProject.id, roomId, zoneId, productId, qty)}
                onUpdateItem={(itemId, patch) => updateItem(activeProject.id, itemId, patch)}
                onRemoveItem={(itemId) => removeItem(activeProject.id, itemId)}
                onMoveItem={(itemId, targetRoomId, targetZoneId) => moveItem(activeProject.id, itemId, targetRoomId, targetZoneId)}
            />
        )
    }

    return (
        <div className="mx-auto max-w-7xl">
            <header className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Structure a project as rooms and zones, add products with quantity, export as BOQ.
                    </p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
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
                        Create your first project to start structuring products by room and zone.
                    </EmptyStateDescription>
                </EmptyState>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {projects.map((p) => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            onOpen={() => setActiveProjectId(p.id)}
                            onRename={async () => {
                                const name = await prompt({
                                    title: 'Rename project',
                                    label: 'Project name',
                                    initialValue: p.name,
                                    submitLabel: 'Save',
                                })
                                if (name) renameProject(p.id, name)
                            }}
                            onDelete={async () => {
                                const ok = await confirm({
                                    title: `Delete "${p.name}"?`,
                                    description: "This action can't be undone.",
                                    confirmLabel: 'Delete',
                                    danger: true,
                                })
                                if (ok) deleteProject(p.id)
                            }}
                            onDuplicate={() => {
                                const copy = duplicateProject(p.id)
                                if (copy) setActiveProjectId(copy.id)
                            }}
                        />
                    ))}
                </div>
            )}

            <CreateProjectModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={(name) => {
                    const created = createProject(name)
                    setCreateModalOpen(false)
                    setActiveProjectId(created.id)
                }}
            />
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
    const totalUnits = projectTotalUnits(project)
    const totalLines = projectTotalLines(project)
    // Preview · muestra hasta 3 nombres de room como pills.
    const previewRooms = project.rooms.slice(0, 3)
    const overflow = Math.max(0, project.rooms.length - previewRooms.length)
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all">
            <button
                type="button"
                onClick={onOpen}
                className="block w-full flex-1 p-4 text-left"
                aria-label={`Open project ${project.name}`}
            >
                <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FolderKanban className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {totalLines} {totalLines === 1 ? 'line' : 'lines'} · {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} · updated {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {project.rooms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {previewRooms.map((room) => (
                            <span
                                key={room.id}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground"
                            >
                                <Home className="h-2.5 w-2.5" aria-hidden="true" />
                                <span className="truncate max-w-[100px]">{room.name}</span>
                            </span>
                        ))}
                        {overflow > 0 && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                +{overflow} more
                            </span>
                        )}
                    </div>
                )}
            </button>
            <div className="flex items-center justify-end gap-0.5 border-t border-border bg-muted/30 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
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
