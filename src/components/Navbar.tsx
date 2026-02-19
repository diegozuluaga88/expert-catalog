import { Menu, MenuButton, MenuItem, MenuItems, Transition, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Fragment } from 'react'
import {
    ChevronDownIcon,
    BellIcon, SunIcon, MoonIcon, EllipsisHorizontalIcon, ArrowRightOnRectangleIcon, CheckIcon,
    BriefcaseIcon, CalculatorIcon, WrenchScrewdriverIcon, PhotoIcon, CreditCardIcon, DocumentTextIcon, BanknotesIcon, BookOpenIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline'; // Using outline for all nav icons
import { useTheme } from 'strata-design-system'
import { useTenant } from '../TenantContext'

import ActionCenter from './notifications/ActionCenter'; // Restore ActionCenter

import logoLightBrand from '../assets/logo-light-brand.png';
import logoDarkBrand from '../assets/logo-dark-brand.png';

// Custom Icons provided by user
function NavHomeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 19H9V13H15V19H18V10L12 5.5L6 10V19ZM4 21V9L12 3L20 9V21H13V15H11V21H4Z" fill="currentColor" />
        </svg>
    )
}

function NavDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 4H9C9.26522 4 9.51957 4.10536 9.70711 4.29289C9.89464 4.48043 10 4.73478 10 5V11C10 11.2652 9.89464 11.5196 9.70711 11.7071C9.51957 11.8946 9.26522 12 9 12H5C4.73478 12 4.48043 11.8946 4.29289 11.7071C4.10536 11.5196 4 11.2652 4 11V5C4 4.73478 4.10536 4.48043 4.29289 4.29289C4.48043 4.10536 4.73478 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 16H9C9.26522 16 9.51957 16.1054 9.70711 16.2929C9.89464 16.4804 10 16.7348 10 17V19C10 19.2652 9.89464 19.5196 9.70711 19.7071C9.51957 19.8946 9.26522 20 9 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V17C4 16.7348 4.10536 16.4804 4.29289 16.2929C4.48043 16.1054 4.73478 16 5 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12H19C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H15C14.7348 20 14.4804 19.8946 14.2929 19.7071C14.1054 19.5196 14 19.2652 14 19V13C14 12.7348 14.1054 12.4804 14.2929 12.2929C14.4804 12.1054 14.7348 12 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V7C20 7.26522 19.8946 7.51957 19.7071 7.70711C19.5196 7.89464 19.2652 8 19 8H15C14.7348 8 14.4804 7.89464 14.2929 7.70711C14.1054 7.51957 14 7.26522 14 7V5C14 4.73478 14.1054 4.48043 14.2929 4.29289C14.4804 4.10536 14.7348 4 15 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function NavInventoryIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 19H6V11H18V19H20V8.35L12 5.15L4 8.35V19ZM2 21V7L12 3L22 7V21H16V13H8V21H2ZM9 21V19H11V21H9ZM11 18V16H13V18H11ZM13 21V19H15V21H13Z" fill="currentColor" />
        </svg>
    )
}

function NavOrdersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 19.925L11.25 15.675L12.65 14.275L15.5 17.125L21.15 11.475L22.55 12.875L15.5 19.925ZM21 10H19V5H17V8H7V5H5V19H11V21H5C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H9.175C9.35833 2.41667 9.71667 1.9375 10.25 1.5625C10.7833 1.1875 11.3667 1 12 1C12.6667 1 13.2625 1.1875 13.7875 1.5625C14.3125 1.9375 14.6667 2.41667 14.85 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V10ZM12 5C12.2833 5 12.5208 4.90417 12.7125 4.7125C12.9042 4.52083 13 4.28333 13 4C13 3.71667 12.9042 3.47917 12.7125 3.2875C12.5208 3.09583 12.2833 3 12 3C11.7167 3 11.4792 3.09583 11.2875 3.2875C11.0958 3.47917 11 3.71667 11 4C11 4.28333 11.0958 4.52083 11.2875 4.7125C11.4792 4.90417 11.7167 5 12 5Z" fill="currentColor" />
        </svg>
    )
}

function NavShelvesIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 18" fill="none">
            <path d="M16 12H14V14H16M16 8H14V10H16M18 16H10V14H12V12H10V10H12V8H10V6H18M8 4H6V2H8M8 8H6V6H8M8 12H6V10H8M8 16H6V14H8M4 4H2V2H4M4 8H2V6H4M4 12H2V10H4M4 16H2V14H4M10 4V0H0V18H20V4H10Z" fill="currentColor" />
        </svg>
    )
}

function NavFacilitiesIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 23V1H5V3H19V1H21V23H19V21H5V23H3ZM5 11H7V7H13V11H19V5H5V11ZM5 19H11V15H17V19H19V13H5V19ZM9 11H11V9H9V11ZM13 19H15V17H13V19Z" fill="currentColor" />
        </svg>
    )
}

// Update supported tabs
export type NavTab = 'Overview' | 'Inventory' | 'Catalogs' | 'MAC' | 'Transactions' | 'CRM' | 'Pricing';

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                group flex items-center justify-center h-10 rounded-full transition-all duration-300 ease-out
                ${active
                    ? 'bg-primary text-primary-foreground px-4 shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground px-2.5 hover:px-4'
                }
            `}
        >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">{icon}</span>
            <span className={`
                overflow-hidden whitespace-nowrap transition-all duration-300 ease-out font-medium text-sm
                ${active
                    ? 'max-w-[150px] opacity-100 ml-2'
                    : 'max-w-0 opacity-0 ml-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-2'
                }
            `}>
                {label}
            </span>
        </button>
    )
}

interface NavbarProps {
    onLogout: () => void;
    activeTab?: NavTab | string; // Allow string for flexibility
    onNavigateToWorkspace: () => void;
    onNavigate: (page: any) => void;
}

export default function Navbar({ onLogout, activeTab = 'Overview', onNavigateToWorkspace, onNavigate }: NavbarProps) {
    const { theme, toggleTheme } = useTheme()
    const { currentTenant, tenants, setTenant } = useTenant()

    const navigation = [
        { name: 'Home', page: 'home', icon: NavHomeIcon },
        { name: 'Dashboard', page: 'dashboard', icon: NavDashboardIcon },
        { name: 'Inventory', page: 'inventory', icon: NavInventoryIcon },
        { name: 'Orders', page: 'orders', icon: NavOrdersIcon },
        { name: 'Profile', page: 'shelves', icon: NavShelvesIcon },
        { name: 'Catalog', page: 'facilities', icon: NavFacilitiesIcon },
    ]

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 min-w-[60vw] max-w-fit lg:min-w-0 lg:max-w-7xl lg:w-[80vw]">
            <div className="relative flex items-center lg:justify-between px-3 py-2 rounded-full gap-1 bg-card/80 backdrop-blur-xl border border-border shadow-lg dark:shadow-glow-md">

                {/* Left Group (Logo + Tenant) */}
                <div className="flex items-center gap-1">
                    {/* Logo */}
                    <div className="px-2 shrink-0">
                        <img src={logoLightBrand} alt="Strata" className="h-8 w-20 object-contain block dark:hidden" />
                        <img src={logoDarkBrand} alt="Strata" className="h-8 w-20 object-contain hidden dark:block" />
                    </div>

                    <div className="h-6 w-px bg-border mx-1 hidden lg:block"></div>

                    {/* Tenant Selector - Desktop Only */}
                    <Menu as="div" className="relative hidden lg:block">
                        <MenuButton className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors outline-none">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Tenant</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-foreground leading-tight">{currentTenant}</span>
                                    <ChevronDownIcon className="w-3 h-3 text-muted-foreground" />
                                </div>
                            </div>
                        </MenuButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <MenuItems className="absolute left-0 top-full mt-2 w-48 origin-top-left rounded-xl bg-popover shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-border p-1 z-50">
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant}>
                                        {({ focus }) => (
                                            <button
                                                onClick={() => setTenant(tenant)}
                                                className={`${focus ? 'bg-accent' : ''} group flex w-full items-center px-4 py-2 text-sm text-foreground rounded-lg transition-colors hover:bg-accent`}
                                            >
                                                {tenant}
                                                {currentTenant === tenant && <CheckIcon className="ml-auto w-4 h-4 text-foreground" />}
                                            </button>
                                        )}
                                    </MenuItem>
                                ))}
                            </MenuItems>
                        </Transition>
                    </Menu>
                </div>



                {/* Center Group (Nav Items) - Absolutely Centered on Desktop */}
                <div className="hidden lg:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {navigation.map(item => (
                        <NavItem
                            key={item.name}
                            icon={<item.icon className="w-4 h-4" />}
                            label={item.name}
                            active={activeTab === item.page}
                            onClick={() => onNavigate(item.page)}
                        />
                    ))}
                </div>

                {/* Right Group (Actions) */}
                <div className="flex items-center gap-1">
                    <div className="h-6 w-px bg-border mx-1 hidden lg:block"></div>

                    {/* Action Center - New Feature */}
                    <ActionCenter />

                    <div className="h-4 w-px bg-border mx-1"></div>

                    <Popover className="relative">
                        <PopoverButton className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none">
                            <NavDashboardIcon className="w-5 h-5" />
                        </PopoverButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <PopoverPanel className="fixed top-[90px] left-1/2 -translate-x-1/2 w-[320px] max-h-[80vh] overflow-y-auto p-3 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl z-[100] lg:fixed lg:top-[90px] lg:left-1/2 lg:-translate-x-1/2 lg:mt-4 scrollbar-minimal">
                                <div className="space-y-4">
                                    {/* Mobile Navigation List - Hidden on Desktop */}
                                    <div className="lg:hidden space-y-1">
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Navigation</h3>
                                        {navigation.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onNavigate(item.page)}
                                                className={`flex items-center gap-3 w-full p-2 rounded-xl text-sm font-medium transition-colors ${activeTab === item.page ? 'bg-primary text-primary-foreground shadow-sm dark:bg-primary/10 dark:text-primary dark:shadow-none' : 'hover:bg-muted text-foreground'}`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                {item.name}
                                            </button>
                                        ))}
                                        <div className="h-px bg-border my-2 mx-1"></div>
                                    </div>

                                    {/* Mobile View: Categorized Grid */}
                                    <div className="lg:hidden space-y-4">
                                        {[
                                            {
                                                title: "Platform",
                                                apps: [
                                                    { icon: <BriefcaseIcon className="w-6 h-6" />, label: "My Work Space", color: "text-zinc-900", bg: "bg-primary", isHighlighted: true, onClick: onNavigateToWorkspace },
                                                    { icon: <NavHomeIcon className="w-6 h-6" />, label: "Portal", color: "text-zinc-900 dark:text-primary", bg: "bg-primary/10", onClick: () => onNavigate('dashboard') },
                                                ]
                                            },
                                            {
                                                title: "Sales Tools",
                                                apps: [
                                                    { icon: <CalculatorIcon className="w-6 h-6" />, label: "Quoting", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
                                                    { icon: <WrenchScrewdriverIcon className="w-6 h-6" />, label: "Configurator", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                                    { icon: <PhotoIcon className="w-6 h-6" />, label: "Marketing", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
                                                ]
                                            },
                                            {
                                                title: "Finance",
                                                apps: [
                                                    { icon: <CreditCardIcon className="w-6 h-6" />, label: "Credit", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                                                    { icon: <DocumentTextIcon className="w-6 h-6" />, label: "Invoices", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                                                    { icon: <BanknotesIcon className="w-6 h-6" />, label: "Rebates", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
                                                ]
                                            },
                                            {
                                                title: "Support",
                                                apps: [
                                                    { icon: <BookOpenIcon className="w-6 h-6" />, label: "Academy", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                                    { icon: <ExclamationCircleIcon className="w-6 h-6" />, label: "Service", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                                                ]
                                            }
                                        ].map((category, idx) => (
                                            <div key={idx}>
                                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{category.title}</h3>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {category.apps.map((app, i) => (
                                                        <button
                                                            key={i}
                                                            // @ts-ignore
                                                            onClick={app.onClick}
                                                            className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-none focus:ring-2 focus:ring-primary ${
                                                                // @ts-ignore
                                                                app.isHighlighted
                                                                    ? 'ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:ring-0'
                                                                    : 'hover:bg-primary hover:text-primary-foreground hover:shadow-md'
                                                                }`}>
                                                            {/* Badge */}
                                                            {/* @ts-ignore */}
                                                            {app.isHighlighted && (
                                                                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/20 text-primary-foreground text-[9px] font-bold shadow-sm backdrop-blur-sm">
                                                                    New
                                                                </span>
                                                            )}
                                                            <div className={`p-2 rounded-2xl transition-all shadow-sm ${
                                                                // @ts-ignore
                                                                app.isHighlighted
                                                                    ? 'bg-primary text-zinc-900 group-hover:bg-transparent group-hover:text-primary-foreground'
                                                                    : `${app.bg} ${app.color} group-hover:bg-transparent group-hover:text-primary-foreground group-hover:shadow-none`
                                                                }`}>
                                                                {app.icon}
                                                            </div>
                                                            <span className={`text-[10px] font-semibold ${
                                                                // @ts-ignore
                                                                app.isHighlighted
                                                                    ? 'text-primary-foreground'
                                                                    : 'text-muted-foreground group-hover:text-primary-foreground'
                                                                }`}>{app.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Unified Grid without Titles */}
                                    <div className="hidden lg:grid grid-cols-3 gap-2">
                                        {[
                                            { icon: <BriefcaseIcon className="w-6 h-6" />, label: "My Work Space", color: "text-zinc-900", bg: "bg-primary", isHighlighted: true, onClick: onNavigateToWorkspace },
                                            { icon: <NavHomeIcon className="w-6 h-6" />, label: "Portal", color: "text-zinc-900 dark:text-primary", bg: "bg-primary/10", onClick: () => onNavigate('dashboard') },
                                            { icon: <CalculatorIcon className="w-6 h-6" />, label: "Quoting", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
                                            { icon: <WrenchScrewdriverIcon className="w-6 h-6" />, label: "Configurator", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                            { icon: <PhotoIcon className="w-6 h-6" />, label: "Marketing", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
                                            { icon: <CreditCardIcon className="w-6 h-6" />, label: "Credit", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                                            { icon: <DocumentTextIcon className="w-6 h-6" />, label: "Invoices", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                                            { icon: <BanknotesIcon className="w-6 h-6" />, label: "Rebates", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
                                            { icon: <BookOpenIcon className="w-6 h-6" />, label: "Academy", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                            { icon: <ExclamationCircleIcon className="w-6 h-6" />, label: "Service", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                                        ]
                                            .map((app, i) => (
                                                <button
                                                    key={i}
                                                    // @ts-ignore
                                                    onClick={app.onClick}
                                                    className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-none focus:ring-2 focus:ring-primary ${
                                                        // @ts-ignore
                                                        app.isHighlighted
                                                            ? 'ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:ring-0'
                                                            : 'hover:bg-primary hover:text-primary-foreground hover:shadow-md'
                                                        }`}>
                                                    {/* Badge */}
                                                    {/* @ts-ignore */}
                                                    {app.isHighlighted && (
                                                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-bold shadow-sm">
                                                            New
                                                        </span>
                                                    )}
                                                    <div className={`p-2 rounded-2xl ${app.bg} ${app.color} transition-all shadow-sm ${
                                                        // @ts-ignore
                                                        app.isHighlighted
                                                            ? 'bg-primary text-zinc-900 group-hover:bg-transparent group-hover:text-primary-foreground'
                                                            : 'group-hover:bg-transparent group-hover:text-primary-foreground group-hover:shadow-none'
                                                        }`}>
                                                        {app.icon}
                                                    </div>
                                                    <span className={`text-[10px] font-semibold ${
                                                        // @ts-ignore
                                                        app.isHighlighted
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground group-hover:text-primary-foreground'
                                                        }`}>{app.label}</span>
                                                </button>
                                            ))}
                                        {/* More Button - Desktop Only */}
                                        <button className="relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-none hover:bg-primary hover:text-primary-foreground hover:shadow-md">
                                            <div className="p-2 rounded-2xl bg-muted text-muted-foreground group-hover:bg-transparent group-hover:text-primary-foreground transition-all shadow-sm">
                                                <EllipsisHorizontalIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary-foreground">More</span>
                                        </button>
                                    </div>
                                </div>
                            </PopoverPanel>
                        </Transition>
                    </Popover>

                    <button onClick={toggleTheme} className="hidden lg:flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-muted transition-colors text-left outline-none">
                            <div className="flex flex-col items-end mr-1 hidden sm:flex lg:hidden max-w-[140px]">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Tenant</span>
                                <span className="text-sm font-bold text-foreground leading-tight truncate w-full text-right">{currentTenant}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                JD
                            </div>
                            <ChevronDownIcon className="w-3 h-3 text-muted-foreground" />
                        </button>
                        {/* User Dropdown */}
                        <div className="absolute top-full right-0 mt-2 w-56 py-2 rounded-xl bg-card/90 backdrop-blur-xl border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">

                            {/* User Info */}
                            <div className="px-4 py-2 border-b border-border mb-1">
                                <p className="text-sm font-medium">Jhon Doe</p>
                                <p className="text-xs text-muted-foreground">Admin</p>
                            </div>

                            {/* Tenant Selector Section */}
                            <div className="px-2 py-1 lg:hidden">
                                <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Switch Tenant</p>
                                {tenants.map((tenant) => (
                                    <button
                                        key={tenant}
                                        onClick={() => setTenant(tenant)}
                                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-foreground rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <span>{tenant}</span>
                                        {currentTenant === tenant && <CheckIcon className="w-3 h-3 text-primary" />}
                                    </button>
                                ))}
                                <div className="h-px bg-border my-1 mx-2"></div>
                            </div>

                            {/* Theme Toggle */}
                            <div className="p-1 lg:hidden">
                                <button onClick={toggleTheme} className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2 transition-colors">
                                    {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                                <div className="h-px bg-border my-1 mx-2"></div>
                            </div>

                            {/* Sign Out */}
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted flex items-center gap-2">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
