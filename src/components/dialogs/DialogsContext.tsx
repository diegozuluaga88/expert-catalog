// F50 · sweep DS · reemplaza window.prompt/confirm nativos por modales
// DS-compliant Promise-based. Uso:
//
//   const { prompt, confirm } = useDialogs()
//
//   const newName = await prompt({
//     title: 'Rename project',
//     label: 'Project name',
//     initialValue: project.name,
//     submitLabel: 'Save',
//   })
//   if (newName) onRename(newName)
//
//   const ok = await confirm({
//     title: `Delete "${project.name}"?`,
//     description: "This can't be undone.",
//     confirmLabel: 'Delete',
//     danger: true,
//   })
//   if (ok) onDelete()
//
// El provider monta un solo Prompt + un solo Confirm globalmente. Cada
// llamada resuelve una Promise cuando el user acciona el botón (string
// value | null para prompt, boolean para confirm).

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import PromptDialog from './PromptDialog'
import ConfirmDialog from './ConfirmDialog'

export interface PromptOptions {
    title: string
    /** Texto helper del label del input (uppercase small caps). */
    label?: string
    /** Placeholder del input. */
    placeholder?: string
    /** Valor inicial · si viene, el input arranca con ese texto seleccionado. */
    initialValue?: string
    /** Texto del botón submit. Default "Save". */
    submitLabel?: string
    /** Texto del botón cancel. Default "Cancel". */
    cancelLabel?: string
    /** Descripción opcional bajo el título. */
    description?: string
    /** Validación · devolvé string de error para bloquear submit. */
    validate?: (value: string) => string | null
}

export interface ConfirmOptions {
    title: string
    description?: string
    /** Texto del botón confirm. Default "Confirm". */
    confirmLabel?: string
    /** Texto del botón cancel. Default "Cancel". */
    cancelLabel?: string
    /** Cuando true el confirm usa el look destructive (rojo). */
    danger?: boolean
}

interface DialogsContextValue {
    prompt: (opts: PromptOptions) => Promise<string | null>
    confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const DialogsContext = createContext<DialogsContextValue | null>(null)

interface PromptState {
    open: boolean
    options: PromptOptions
}
interface ConfirmState {
    open: boolean
    options: ConfirmOptions
}

export function DialogsProvider({ children }: { children: ReactNode }) {
    const [promptState, setPromptState] = useState<PromptState>({ open: false, options: { title: '' } })
    const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, options: { title: '' } })
    const promptResolveRef = useRef<((value: string | null) => void) | null>(null)
    const confirmResolveRef = useRef<((value: boolean) => void) | null>(null)

    const prompt = useCallback((options: PromptOptions) => {
        return new Promise<string | null>((resolve) => {
            promptResolveRef.current = resolve
            setPromptState({ open: true, options })
        })
    }, [])

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            confirmResolveRef.current = resolve
            setConfirmState({ open: true, options })
        })
    }, [])

    const handlePromptClose = (value: string | null) => {
        setPromptState((s) => ({ ...s, open: false }))
        promptResolveRef.current?.(value)
        promptResolveRef.current = null
    }

    const handleConfirmClose = (value: boolean) => {
        setConfirmState((s) => ({ ...s, open: false }))
        confirmResolveRef.current?.(value)
        confirmResolveRef.current = null
    }

    return (
        <DialogsContext.Provider value={{ prompt, confirm }}>
            {children}
            <PromptDialog
                open={promptState.open}
                options={promptState.options}
                onClose={handlePromptClose}
            />
            <ConfirmDialog
                open={confirmState.open}
                options={confirmState.options}
                onClose={handleConfirmClose}
            />
        </DialogsContext.Provider>
    )
}

export function useDialogs(): DialogsContextValue {
    const ctx = useContext(DialogsContext)
    if (!ctx) {
        // Fallback a window.prompt/confirm si el provider no está montado
        // (por ejemplo tests sin provider). No debería pasar en runtime real.
        return {
            prompt: async (opts) => window.prompt(opts.title, opts.initialValue ?? '') ?? null,
            confirm: async (opts) => window.confirm(opts.title + (opts.description ? '\n\n' + opts.description : '')),
        }
    }
    return ctx
}
