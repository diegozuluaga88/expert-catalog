import { useState, useMemo } from 'react'
import { Search, MessageSquare, ExternalLink, MoreHorizontal, Inbox } from 'lucide-react'
import Navbar from './components/Navbar'
import Breadcrumbs from './components/Breadcrumbs'
import { avatarGradient } from './components/team/teamMembers'

interface FeedbackBoardProps {
    onLogout: () => void
    onNavigate: (page: string) => void
}

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'
type FeedbackState = 'Submitted' | 'Triaged' | 'Assigned' | 'Resolved' | 'Closed' | 'Dropped' | 'Duplicated'
type Category = 'Bug' | 'Feature Request' | 'UI/UX' | 'Data' | 'Performance'

interface FeedbackItem {
    id: string
    description: string
    category: Category
    severity: Severity
    state: FeedbackState
    assignedTo?: { id: string; name: string; initials: string }
    submittedBy: string
    date: string
    jira?: string
}

const FEEDBACK: FeedbackItem[] = [
    {
        id: 'FB-1042',
        description: 'Line items not extracting from multi-page Magnuson quotes',
        category: 'Bug', severity: 'Critical', state: 'Assigned',
        assignedTo: { id: 'marcus', name: 'Marcus Webb', initials: 'MW' },
        submittedBy: 'r.ramirez@special-t.com', date: 'Jun 12, 2026', jira: 'OCR-318',
    },
    {
        id: 'FB-1041',
        description: 'Add bulk "Mark as Completed" action for reconciled documents',
        category: 'Feature Request', severity: 'Medium', state: 'Triaged',
        assignedTo: { id: 'priya', name: 'Priya Shah', initials: 'PS' },
        submittedBy: 'c.morales@special-t.com', date: 'Jun 11, 2026', jira: 'OCR-309',
    },
    {
        id: 'FB-1040',
        description: 'Vendor name shows lowercase for "ergotron" — should match catalog casing',
        category: 'UI/UX', severity: 'Low', state: 'Resolved',
        assignedTo: { id: 'daniel', name: 'Daniel Okafor', initials: 'DO' },
        submittedBy: 'd.zuluaga@special-t.com', date: 'Jun 10, 2026', jira: 'OCR-301',
    },
    {
        id: 'FB-1039',
        description: 'Upload modal hangs on PDFs larger than 20MB',
        category: 'Performance', severity: 'High', state: 'Submitted',
        submittedBy: 'k.nguyen@special-t.com', date: 'Jun 10, 2026',
    },
    {
        id: 'FB-1038',
        description: 'BuzziSpace SKU US-SQ26-00958 mapped to wrong catalog entry',
        category: 'Data', severity: 'High', state: 'Assigned',
        assignedTo: { id: 'sarah', name: 'Sarah Johnson', initials: 'SJ' },
        submittedBy: 'r.ramirez@special-t.com', date: 'Jun 09, 2026', jira: 'OCR-296',
    },
    {
        id: 'FB-1037',
        description: 'Duplicate of FB-1031 — same discrepancy on Dubois custom carpentry',
        category: 'Bug', severity: 'Medium', state: 'Duplicated',
        submittedBy: 'c.morales@special-t.com', date: 'Jun 08, 2026',
    },
    {
        id: 'FB-1036',
        description: 'Funnel counts not refreshing after deprecating a document',
        category: 'Bug', severity: 'Medium', state: 'Closed',
        assignedTo: { id: 'noah', name: 'Noah Fischer', initials: 'NF' },
        submittedBy: 'd.zuluaga@special-t.com', date: 'Jun 06, 2026', jira: 'OCR-284',
    },
    {
        id: 'FB-1035',
        description: 'Request: export reconciled records to CSV',
        category: 'Feature Request', severity: 'Low', state: 'Dropped',
        submittedBy: 'k.nguyen@special-t.com', date: 'Jun 04, 2026',
    },
]

const FUNNEL: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'jira', label: 'In Jira' },
    { id: 'Submitted', label: 'Submitted' },
    { id: 'Triaged', label: 'Triaged' },
    { id: 'Assigned', label: 'Assigned' },
    { id: 'Resolved', label: 'Resolved' },
    { id: 'Closed', label: 'Closed' },
    { id: 'Dropped', label: 'Dropped' },
    { id: 'Duplicated', label: 'Duplicated' },
]

function severityClasses(s: Severity): string {
    switch (s) {
        case 'Critical': return 'bg-destructive/10 text-destructive'
        case 'High': return 'bg-warning/10 text-warning'
        case 'Medium': return 'bg-info/10 text-info'
        case 'Low': return 'bg-muted text-muted-foreground'
    }
}

function stateClasses(s: FeedbackState): string {
    switch (s) {
        case 'Submitted': return 'bg-info/10 text-info'
        case 'Triaged': return 'bg-warning/10 text-warning'
        case 'Assigned': return 'bg-info/10 text-info'
        case 'Resolved': return 'bg-success/10 text-success'
        default: return 'bg-muted text-muted-foreground'
    }
}

export default function FeedbackBoard({ onLogout, onNavigate }: FeedbackBoardProps) {
    const [activeTab, setActiveTab] = useState('all')
    const [query, setQuery] = useState('')

    const counts = useMemo(() => {
        const c: Record<string, number> = {
            all: FEEDBACK.length,
            jira: FEEDBACK.filter(f => f.jira).length,
        }
        for (const f of FEEDBACK) c[f.state] = (c[f.state] ?? 0) + 1
        return c
    }, [])

    const filtered = useMemo(() => {
        return FEEDBACK.filter(f => {
            if (activeTab === 'jira' && !f.jira) return false
            if (activeTab !== 'all' && activeTab !== 'jira' && f.state !== activeTab) return false
            if (query.trim()) {
                const q = query.toLowerCase()
                if (!f.description.toLowerCase().includes(q) &&
                    !f.submittedBy.toLowerCase().includes(q) &&
                    !f.category.toLowerCase().includes(q)) return false
            }
            return true
        })
    }, [activeTab, query])

    return (
        <div className="min-h-screen bg-background font-sans text-foreground pb-10">
            {/* Breadcrumb hoisted above navbar — matches prod top-left position */}
            <div className="fixed top-2 left-6 z-50 text-xs opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
                <Breadcrumbs items={[
                    { label: 'Expert Hub', onClick: () => onNavigate('ocr-tracking') },
                    { label: 'Feedback Board', active: true },
                ]} />
            </div>

            <Navbar onLogout={onLogout} activeTab="Feedback" onNavigateToWorkspace={() => onNavigate('ocr-tracking')} onNavigate={onNavigate} />

            <div className="pt-24 px-4 max-w-screen-2xl mx-auto space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {/* Header: title + funnel + search */}
                    <div className="p-6 border-b border-border">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 whitespace-nowrap">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Feedback Board
                                </h3>
                                {/* Funnel */}
                                <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto max-w-full">
                                    {FUNNEL.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 outline-none whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                                            }`}
                                        >
                                            {tab.label}
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-background'
                                            }`}>
                                                {counts[tab.id] ?? 0}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search feedback…"
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <Inbox className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No feedback yet</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                When users submit feedback, rows will appear here live.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        {['Description', 'Category', 'Severity', 'State', 'Assigned To', 'Submitted By', 'Date', 'Jira', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(f => (
                                        <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                                            <td className="px-4 py-3 max-w-md">
                                                <div className="font-medium text-foreground">{f.description}</div>
                                                <div className="text-xs text-muted-foreground">{f.id}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{f.category}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityClasses(f.severity)}`}>
                                                    {f.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stateClasses(f.state)}`}>
                                                    {f.state}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {f.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradient(f.assignedTo.id)} flex items-center justify-center text-[10px] font-bold text-white`}>
                                                            {f.assignedTo.initials}
                                                        </div>
                                                        <span className="text-foreground">{f.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{f.submittedBy}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{f.date}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {f.jira ? (
                                                    <a className="inline-flex items-center gap-1 text-info hover:underline cursor-pointer">
                                                        {f.jira}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Actions"
                                                    aria-label="Feedback actions"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
