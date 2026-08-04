// F52 · E · botón "Dealer terms" del ProjectDetailView.
//
// Wrapper del MyDealerInfoPage en modo contextual · muestra solo las
// relationships del dealer con los brands que aparecen en este project.
// Es el moment de mayor valor del PRD P4 · el dealer ve sus márgenes en
// el mismo screen donde está armando el BOQ.

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Handshake } from 'lucide-react'
import MyDealerInfoPage from '../dealerinfo/MyDealerInfoPage'

interface ProjectDealerTermsModalProps {
    open: boolean
    onClose: () => void
    projectName: string
    /** Lista únique de brand names presentes en el project (derivada por
     *  el consumer via `UNIFIED_INDEX[productId]?.product.brand`). Puede
     *  venir vacía si el project no tiene items. */
    brandsInProject: string[]
}

export default function ProjectDealerTermsModal({
    open,
    onClose,
    projectName,
    brandsInProject,
}: ProjectDealerTermsModalProps) {
    return (
        <Transition show={open} as={Fragment} appear>
            <Dialog onClose={onClose} className="relative z-[70]">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            <header className="flex items-start justify-between gap-3 border-b border-border p-5">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Handshake className="h-3 w-3" />
                                        Dealer terms · scoped to this project
                                    </p>
                                    <h2 className="mt-0.5 text-lg font-bold text-foreground leading-snug">
                                        {projectName}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-5">
                                <MyDealerInfoPage
                                    variant="contextual"
                                    filterByBrands={brandsInProject}
                                />
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
