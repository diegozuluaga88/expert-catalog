import { useState, useRef, useEffect, Fragment } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCatalogVersion } from '../context/CatalogVersionContext'
import { useTheme } from 'strata-design-system'
import { useTenant } from '../TenantContext'
import { ScanEye, MessageSquare, Moon, Sun, LogOut, ChevronDown, Building2, Check, KeyRound, Boxes, Receipt, Menu as MenuIcon, X as XIcon, BarChart3 } from 'lucide-react'
// F71b · delivery notifications hub · bell + dropdown con eventos de
// shipped/delivered persistentes. Reemplaza el <Bell> estático que había
// en el navbar sin dropdown ni badge.
import NotificationBell from '../catalog/notifications/NotificationBell'
// F56b · HeadlessUI Dialog para el mobile drawer que colapsa las 4
// nav tabs top-level en <md · focus trap + escape gratis.
import { Dialog, Transition } from '@headlessui/react'
import logoLightBrand from '../assets/logo-light-brand.png'
import logoDarkBrand from '../assets/logo-dark-brand.png'
import ChangePasswordModal from './auth/ChangePasswordModal'
// F58b.3 · el badge amber del avatar + item "My Dealer Info" del dropdown
// se eliminaron · el signal se movió al ManageSetupPanel del MRL sidebar
// (y al badge del tab Manufacturers del modal My Setup).

type NavTab = 'OCR' | 'Feedback'

interface NavbarProps {
    onLogout: () => void;
    activeTab?: NavTab | string;
    onNavigateToWorkspace: () => void;
    onNavigate: (page: any) => void;
}

export default function Navbar({ onLogout, activeTab = 'OCR', onNavigate }: NavbarProps) {
    const { theme, toggleTheme } = useTheme()
    const { user } = useAuth()
    const { selectedTenants, tenants, toggleTenant, selectAll } = useTenant()

    // F49 · v1 (actual) vs v2 (refactor UX) · el dropdown del tab "Catalog"
    // permite a los stakeholders comparar la versión estable con la que va
    // avanzando el refactor sin bloquear ninguna de las dos.
    const { version: catalogVersion, setVersion: setCatalogVersion } = useCatalogVersion()
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [isTenantOpen, setIsTenantOpen] = useState(false)
    const [isCatalogVersionOpen, setIsCatalogVersionOpen] = useState(false)
    // F56b · mobile nav drawer · abre las 4 nav tabs en fullscreen dialog
    // cuando la viewport es <md (el pill fixed no cabe con logo + tabs +
    // avatar + acciones · antes overflow-clippeaba).
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const tenantRef = useRef<HTMLDivElement>(null)
    const catalogVersionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) {
                setIsTenantOpen(false)
            }
        }
        if (isTenantOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isTenantOpen])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (catalogVersionRef.current && !catalogVersionRef.current.contains(e.target as Node)) {
                setIsCatalogVersionOpen(false)
            }
        }
        if (isCatalogVersionOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isCatalogVersionOpen])

    // MRL scope cleanup (2026-08-27) · Capa 1 · se retiraron los tabs
    // OCR Tracking, Transactions y Feedback · venían del proyecto Strata
    // del que este repo se forkeó y ninguna fuente de scope los menciona.
    // Ver strata-docs/09-mrl-uwh/DIAGNOSIS.md §3.1.
    const tabs: { name: string; label: string; page: string; icon: any; hidden?: boolean }[] = [
        { name: 'Catalog', label: 'Catalog', page: 'catalog', icon: Boxes },
    ]
    const visibleTabs = tabs.filter(t => !t.hidden)

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Diego Zuluaga'
    const userRole = (user?.user_metadata as { role?: string } | undefined)?.role ?? 'Expert'

    return (
        <>
            {/* Navbar — matches UI-Dealer: rounded-full, top-6, min-w-[60vw], bg-card/80 backdrop-blur-xl */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 min-w-[60vw] max-w-fit lg:min-w-0 lg:max-w-7xl lg:w-[80vw]">
                <div className="relative flex items-center lg:justify-between px-3 py-2 rounded-full gap-1 bg-card/80 backdrop-blur-xl border border-border shadow-lg dark:shadow-glow-md">

                    {/* Left: Logo + Brand + Tenant Selector */}
                    <div className="flex items-center gap-1">
                        <div className="px-2 shrink-0">
                            <img src={logoLightBrand} alt="Strata" className="h-8 w-20 object-contain block dark:hidden" />
                            <img src={logoDarkBrand} alt="Strata" className="h-8 w-20 object-contain hidden dark:block" />
                        </div>
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <div className="hidden sm:flex items-center gap-1 px-2" ref={tenantRef}>
                            <div>
                                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">DEALER</div>
                                <button
                                    onClick={() => setIsTenantOpen(!isTenantOpen)}
                                    className="flex items-center gap-1.5 text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors"
                                >
                                    {selectedTenants.length === 1 ? selectedTenants[0] : `${selectedTenants.length} Dealers`}
                                    <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isTenantOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Tenant Dropdown */}
                            {isTenantOpen && (
                                <div className="absolute left-14 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-3 py-2 border-b border-border mb-1 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenants</span>
                                        <button
                                            onClick={selectAll}
                                            className="text-[10px] font-medium text-primary hover:underline"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                    {tenants.map(tenant => {
                                        const isSelected = selectedTenants.includes(tenant)
                                        return (
                                            <button
                                                key={tenant}
                                                onClick={() => toggleTenant(tenant)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                }`}>
                                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                                </div>
                                                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className={`text-left truncate ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                    {tenant}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* F56b · Hamburger trigger · solo visible en <md ·
                        colapsa las 4 nav tabs top-level en un drawer
                        fullscreen. En md+ el hamburger se oculta y los
                        tabs se muestran normales. */}
                    <button
                        type="button"
                        onClick={() => setIsMobileNavOpen(true)}
                        aria-label="Open navigation menu"
                        className="flex md:hidden items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all mx-auto"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>

                    {/* Center: Nav Tabs · hidden en <md · visible en md+ */}
                    <div className="hidden md:flex items-center gap-1 mx-auto">
                        {visibleTabs.map(tab => {
                            const isActive = activeTab === tab.name
                            const Icon = tab.icon
                            // F49 · el tab "Catalog" abre un dropdown de versiones
                            // (v1 actual · v2 refactor UX) en vez de navegar directo.
                            if (tab.name === 'Catalog') {
                                return (
                                    <div key={tab.name} className="relative" ref={catalogVersionRef}>
                                        <button
                                            onClick={() => setIsCatalogVersionOpen(!isCatalogVersionOpen)}
                                            className={`relative flex items-center justify-center h-9 px-3 rounded-full transition-all duration-300 group overflow-hidden ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-white/90 dark:hover:bg-zinc-800/90 text-muted-foreground hover:text-foreground hover:shadow-sm'
                                            }`}
                                            aria-haspopup="menu"
                                            aria-expanded={isCatalogVersionOpen}
                                        >
                                            <span className="relative z-10"><Icon className="w-5 h-5" /></span>
                                            <span className={`ml-2 text-sm font-bold whitespace-nowrap transition-all duration-300 ease-in-out ${
                                                isActive ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100'
                                            }`}>
                                                {tab.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-3 w-3 shrink-0 transition-transform ${isCatalogVersionOpen ? 'rotate-180' : ''} ${
                                                isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                                            }`} />
                                        </button>

                                        {isCatalogVersionOpen && (
                                            <div
                                                className="absolute right-1/2 translate-x-1/2 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200"
                                                role="menu"
                                            >
                                                <div className="px-3 py-2 border-b border-border mb-1">
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog version</span>
                                                </div>
                                                {(['v1', 'v2'] as const).map(v => {
                                                    const isSelected = catalogVersion === v
                                                    const label = v === 'v1' ? 'v1 (actual)' : 'v2 (refactor UX)'
                                                    const sub = v === 'v1'
                                                        ? '5 sub-tabs · MRL · Dealer · Figma · Product Catalog · My Selection'
                                                        : 'Sin Figma/Dealer · 3 sub-tabs (MRL · Product Catalog · My Selection)'
                                                    return (
                                                        <button
                                                            key={v}
                                                            role="menuitemradio"
                                                            aria-checked={isSelected}
                                                            onClick={() => {
                                                                setCatalogVersion(v)
                                                                setIsCatalogVersionOpen(false)
                                                                onNavigate(tab.page)
                                                            }}
                                                            className="w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                                                        >
                                                            <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                                isSelected ? 'bg-primary border-primary' : 'border-border'
                                                            }`}>
                                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm ${isSelected ? 'text-foreground font-semibold' : 'text-foreground font-medium'}`}>
                                                                    {label}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                                                                    {sub}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                            return (
                                <button
                                    key={tab.name}
                                    onClick={() => onNavigate(tab.page)}
                                    className={`relative flex items-center justify-center h-9 px-3 rounded-full transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-white/90 dark:hover:bg-zinc-800/90 text-muted-foreground hover:text-foreground hover:shadow-sm'
                                    }`}
                                >
                                    <span className="relative z-10"><Icon className="w-5 h-5" /></span>
                                    <span className={`ml-2 text-sm font-bold whitespace-nowrap transition-all duration-300 ease-in-out ${
                                        isActive ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100'
                                    }`}>
                                        {tab.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Chat / Assistant */}
                        <button
                            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title="Assistant"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* F71b · Bell con badge unread + dropdown de notifications */}
                        <NotificationBell />

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        {/* Separator */}
                        <div className="w-px h-6 bg-border mx-1"></div>

                        {/* User */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <div className="relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face"
                                        alt={displayName}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-border"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="w-8 h-8 rounded-full bg-ai flex items-center justify-center text-white text-xs font-bold hidden">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    {/* F58b.3 · badge amber removido · el signal
                                        se mueve al ManageSetupPanel del MRL. */}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">{displayName}</div>
                                    <div className="text-[10px] text-muted-foreground leading-none">{userRole}</div>
                                </div>
                                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                            </button>

                            {isUserMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 p-1">
                                        <div className="px-3 py-2 border-b border-border mb-1">
                                            <div className="text-sm font-medium text-foreground">{displayName}</div>
                                            <div className="text-xs text-muted-foreground">{user?.email || 'sara.chen@strata.com'}</div>
                                        </div>
                                        {/* F58b.3 · item "My Dealer Info" removido
                                            del avatar dropdown · consolidado en el
                                            modal "My Setup" (tab Manufacturers) que
                                            se abre desde Product Catalog CTA o el
                                            ManageSetupPanel del MRL sidebar. */}
                                        {/* F67 · View as manufacturer · abre el
                                            ManufacturerInsightsPage · demo del
                                            PRD Section 05 · role toggle simulado. */}
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); onNavigate('manufacturer-insights') }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            View as manufacturer
                                        </button>
                                        <div className="my-1 border-t border-border" />
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); setShowChangePassword(true); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            Change Password
                                        </button>
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light dark:hover:bg-error/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />

            {/* F56b · Mobile nav drawer · fullscreen dialog con las 4 nav
                tabs top-level stacked (OCR Tracking · Transactions ·
                Feedback · Catalog). Se abre desde el hamburger del pill
                fixed. HeadlessUI Dialog aporta focus trap + escape gratis. */}
            <Transition show={isMobileNavOpen} as={Fragment} appear>
                <Dialog onClose={() => setIsMobileNavOpen(false)} className="relative z-[70] md:hidden">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                    </Transition.Child>
                    <div className="fixed inset-y-0 left-0 flex max-w-full">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="ease-in duration-150" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                            <Dialog.Panel className="flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-background shadow-xl">
                                <div className="flex items-center justify-between border-b border-border p-4">
                                    <Dialog.Title as="h2" className="text-sm font-bold uppercase tracking-wider text-foreground">
                                        Navigation
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        aria-label="Close navigation menu"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <nav className="flex flex-col p-2">
                                    {visibleTabs.map(tab => {
                                        const isActive = activeTab === tab.name
                                        const Icon = tab.icon
                                        return (
                                            <button
                                                key={tab.name}
                                                type="button"
                                                onClick={() => {
                                                    setIsMobileNavOpen(false)
                                                    // Catalog abre v2 por default en mobile · no vale
                                                    // la pena repetir el dropdown v1/v2 en el drawer.
                                                    onNavigate(tab.page)
                                                }}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <Icon className="h-5 w-5 flex-shrink-0" />
                                                <span>{tab.label}</span>
                                            </button>
                                        )
                                    })}
                                </nav>
                                {/* Tenant selector mobile · como en <sm el DEALER inline queda
                                    hidden, este drawer también le da acceso. */}
                                <div className="mt-auto border-t border-border p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dealer</p>
                                    <div className="space-y-0.5">
                                        {tenants.map(tenant => {
                                            const isSelected = selectedTenants.includes(tenant)
                                            return (
                                                <button
                                                    key={tenant}
                                                    type="button"
                                                    onClick={() => toggleTenant(tenant)}
                                                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                                                >
                                                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected ? 'bg-primary border-primary' : 'border-border'
                                                    }`}>
                                                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                                    </div>
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <span className={`text-left truncate ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                        {tenant}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
