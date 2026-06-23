import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface SelectProps<T> {
    value: T
    onChange: (value: T) => void
    options: T[]
    className?: string
    align?: 'right' | 'left'
}

export default function Select<T extends string>({ value, onChange, options, className, align = 'left' }: SelectProps<T>) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className={cn("relative", className)}>
                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-background py-2 pl-3 pr-10 text-left border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/50 transition-colors">
                    <span className="block truncate">{value}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                </ListboxButton>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ListboxOptions className={cn(
                        "absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50",
                        align === 'right' ? "right-0" : "left-0"
                    )}>
                        {options.map((option, personIdx) => (
                            <ListboxOption
                                key={personIdx}
                                className={({ active }) =>
                                    cn(
                                        "relative cursor-default select-none py-2 pl-10 pr-4",
                                        active ? "bg-accent text-accent-foreground" : "text-foreground"
                                    )
                                }
                                value={option}
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                            {option}
                                        </span>
                                        {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-900 dark:text-primary">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Transition>
            </div>
        </Listbox>
    )
}
