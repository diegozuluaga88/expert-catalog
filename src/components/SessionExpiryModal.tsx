import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon, ArrowPathIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface SessionExpiryModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionExpiryModal({ isOpen, onExtend, onLogout }: SessionExpiryModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onExtend}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-card p-6 text-center shadow-xl transition-all border border-border space-y-4">
                <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="space-y-2">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    Session Expiring Soon
                  </Dialog.Title>
                  <p className="text-sm text-muted-foreground">
                    Your session will expire in less than 5 minutes. Would you like to extend your session?
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onLogout}
                    className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Log Out
                  </button>
                  <button
                    onClick={onExtend}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Extend Session
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
