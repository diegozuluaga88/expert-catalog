import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

// Generative UI Types
export type MessageType = 'user' | 'system';

export interface ArtifactData {
    id: string;
    type: 'order_correction' | 'stock_matrix' | 'layout_proposal' | 'warranty_claim' | 'quote_proposal' | 'field_mapping_request' | 'erp_connect_modal' | 'erp_po_dashboard' | 'asset_review' | 'mode_selection' | 'erp_selector' | 'erp_system_selector' | 'text';
    title?: string;
    data?: any;
    source?: string; // e.g., "Urgent Actions", "Recent Activity"
    link?: string;   // e.g., "/orders/OR-123"
}

export interface StreamMessage {
    id: string;
    type: MessageType;
    content: string;
    timestamp: Date;
    artifact?: ArtifactData;
}

export interface GenUITrigger {
    id: string;
    label: string;
    prompt: string;
    category: 'correction' | 'sourcing' | 'layout' | 'support' | 'sales';
}

export const TRIGGERS: GenUITrigger[] = [
    { id: 't1', label: 'Order Correction', prompt: 'Correct Order #402, wrong casters sent.', category: 'correction' },
    { id: 't2', label: 'Urgent Sourcing', prompt: 'Find urgent stock for Standing Desks (need tomorrow).', category: 'sourcing' },
    { id: 't3', label: 'Inventory Check', prompt: 'Check global inventory for Herman Miller Aeron chairs.', category: 'sourcing' },
    { id: 't4', label: 'Warranty Check', prompt: 'Check warranty for Client X, peeling fabric issue.', category: 'support' },
    { id: 't5', label: 'Sales Proposal', prompt: 'Draft proposal for Stellar Tech, industrial zen style.', category: 'sales' },
];

interface GenUIContextType {
    messages: StreamMessage[];
    isGenerating: boolean;
    isStreamOpen: boolean;
    showTriggers: boolean;
    sendMessage: (content: string, type?: MessageType) => void;
    clearStream: () => void;
    toggleStream: () => void;
    setStreamOpen: (isOpen: boolean) => void;
    setShowTriggers: (show: boolean) => void;
    navigate: (path: string) => void;
}

const GenUIContext = createContext<GenUIContextType | undefined>(undefined);

export const GenUIProvider = ({ children, onNavigate }: { children: ReactNode, onNavigate?: (path: string) => void }) => {
    const [messages, setMessages] = useState<StreamMessage[]>([
        {
            id: 'welcome',
            type: 'system',
            content: 'Hello! I am your Strata Assistant. How can I help you with your dealership tasks today?',
            timestamp: new Date(),
        }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isStreamOpen, setStreamOpen] = useState(false);
    const [showTriggers, setShowTriggers] = useState(false);

    const navigate = (path: string) => {
        if (onNavigate) onNavigate(path);
    };

    const toggleStream = () => setStreamOpen(prev => !prev);

    const sendMessage = async (content: string, type: MessageType = 'user') => {
        // 1. Add Message
        const newMsg: StreamMessage = {
            id: Date.now().toString(),
            type,
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMsg]);
        setStreamOpen(true); // Auto-open stream on send

        // Only simulate AI processing if it's a user message
        if (type === 'user') {
            setIsGenerating(true);

            // 2. Simulate AI Processing (Intent Engine)
            // This is a deterministic mock for the POC
            setTimeout(() => {
                let responseArtifact: ArtifactData | undefined;
                let responseText = "I'm not sure how to handle that yet.";

                const lowerContent = content.toLowerCase();
                console.log('GenUI Debug:', { content, lowerContent });

                // Use Case 1: Order Correction
                if (lowerContent.includes('order #402') || lowerContent.includes('wrong caster')) {
                    console.log('Matched: Order Correction');
                    responseText = "I found Order #402. It looks like you want to update the casters.";
                    responseArtifact = {
                        id: 'art_correct_402',
                        type: 'order_correction',
                        title: 'Order Correction #402',
                        data: { orderId: '402', originalItem: 'Aeron Chair', issue: 'Casters', suggestion: 'Hard Floor Casters' }
                    };
                }
                // Use Case 2: Urgent Procurement
                else if (lowerContent.includes('standing desks') && (lowerContent.includes('urgent') || lowerContent.includes('tomorrow'))) {
                    console.log('Matched: Urgent Procurement');
                    responseText = "I've located stock for 10 standing desks avail for pickup tomorrow in Chicago.";
                    responseArtifact = {
                        id: 'art_stock_chi',
                        type: 'stock_matrix',
                        title: 'Urgent Stock Locator',
                        data: { item: 'Height-Adjustable Desk', qty: 10, location: 'Chicago Warehouse', canPickup: true }
                    };
                }
                // Use Case 3: Inventory Check (Replaced Layout Generator)
                else if (lowerContent.includes('inventory') || lowerContent.includes('stock check') || lowerContent.includes('aeron')) {
                    console.log('Matched: Inventory Check');
                    responseText = "Checking global inventory... I found significant stock availability across 3 regions.";
                    responseArtifact = {
                        id: 'art_inv_check',
                        type: 'stock_matrix',
                        title: 'Inventory Status: Herman Miller Aeron',
                        data: { item: 'Aeron Chair (Graphite, Size B)', qty: 142, location: 'Main Distribution Center', canPickup: true }
                    };
                }
                // Use Case 4: Warranty Check
                // Use Case 4: Warranty Claim
                else if (lowerContent.includes('fabric') || lowerContent.includes('peeling') || lowerContent.includes('claim')) {
                    console.log('Matched: Warranty Claim');
                    responseText = "I've analyzed the warranty for Client X. The fabric issue is covered.";
                    responseArtifact = {
                        id: 'art_warranty_x',
                        type: 'warranty_claim',
                        title: 'Warranty Assessment',
                        data: { client: 'Client X', issue: 'Fabric Delamination', coverage: 'Full Replacement', policy: '12-Year Surface' }
                    };
                }
                // Use Case 5: Start Quote (Mode Selection)
                else if (lowerContent.includes('proposal') || lowerContent.includes('stellar tech') || (lowerContent.includes('quote') && !lowerContent.includes('qt-2941') && !lowerContent.includes('mode selected') && !lowerContent.includes('selected erp'))) {
                    console.log('Matched: Mode Selection (Quote)');
                    responseText = "I can help you create a formal Sales Proposal. How would you like to import the data?";
                    responseArtifact = {
                        id: 'art_mode_select',
                        type: 'mode_selection',
                        title: 'New Quote: Select Source',
                        data: {},
                        source: 'System'
                    };
                }

                // Use Case: Mode Selection - File
                else if (lowerContent.includes('mode selected: file')) {
                    responseText = "I've analyzed the uploaded request. Here are the extracted line items for validation.";
                    responseArtifact = {
                        id: 'art_quote_file_new',
                        type: 'asset_review',
                        title: 'Asset Review: Uploaded Request',
                        data: {
                            fileName: 'Request_Email_Export.pdf',
                            assets: [
                                {
                                    id: 'p1',
                                    description: 'Industrial Workstation (4-Pod)',
                                    sku: 'WS-IND-4P',
                                    qty: 3,
                                    unitPrice: 4200.00,
                                    totalPrice: 12600.00,
                                    status: 'suggestion',
                                    suggestion: {
                                        sku: 'WS-IND-4P-PRO',
                                        price: 4500.00,
                                        reason: 'Upgrade to PRO model recommended for client tier'
                                    }
                                },
                                {
                                    id: 'p2',
                                    description: 'Mesh Task Chair',
                                    sku: 'CH-MESH-BLK',
                                    qty: 12,
                                    unitPrice: 550.00,
                                    totalPrice: 6600.00,
                                    status: 'review',
                                    issues: ['Confirm color preference (Black vs Grey)']
                                }
                            ]
                        },
                        source: 'File Import'
                    };
                }

                // Use Case: Mode Selection - ERP
                else if (lowerContent.includes('mode selected: connect erp')) {
                    responseText = "To begin, please select which ERP system you'd like to connect with.";
                    responseArtifact = {
                        id: 'art_erp_system_select',
                        type: 'erp_system_selector',
                        title: 'Select ERP System',
                        data: {},
                        source: 'System'
                    };
                }

                // Use Case: ERP System Selected -> Show Order List
                else if (lowerContent.includes('system selected')) {
                    const systemName = content.split(': ')[1] || 'NetSuite';
                    responseText = `Secure connection established with ${systemName}. I found 3 actionable Purchase Orders.`;
                    responseArtifact = {
                        id: 'art_erp_select',
                        type: 'erp_selector',
                        title: `ERP Integration: ${systemName}`,
                        data: { system: systemName },
                        source: `${systemName} connector`
                    };
                }

                // Use Case: ERP Order Selected
                else if (lowerContent.includes('selected erp order')) {
                    const orderId = content.split(': ')[1] || 'PO-2024-001';
                    responseText = `Successfully imported ${orderId}. I've mapped the SKUs to our internal catalog.`;
                    responseArtifact = {
                        id: 'art_quote_erp_new',
                        type: 'asset_review',
                        title: `Asset Review: ${orderId}`,
                        data: {
                            fileName: `${orderId}.xml`,
                            assets: [
                                {
                                    id: 'e1',
                                    description: 'Executive Desk (Walnut)',
                                    sku: 'DSK-EXE-WAL',
                                    qty: 2,
                                    unitPrice: 1200.00,
                                    totalPrice: 2400.00,
                                    status: 'validated'
                                },
                                {
                                    id: 'e2',
                                    description: 'Conf Chair (Leather)',
                                    sku: 'CHR-CONF-LTH',
                                    qty: 8,
                                    unitPrice: 850.00,
                                    totalPrice: 6800.00,
                                    status: 'review',
                                    issues: ['Needs review']
                                },
                                {
                                    id: 'e3',
                                    description: 'Power Module (Desktop)',
                                    sku: 'ACC-PWR-DT',
                                    qty: 4,
                                    unitPrice: 150.00,
                                    totalPrice: 600.00,
                                    status: 'suggestion',
                                    suggestion: {
                                        sku: 'ACC-PWR-DT-USB-C',
                                        price: 180.00,
                                        reason: 'Newer USB-C model available'
                                    }
                                }
                            ]
                        },
                        source: 'NetSuite Import'
                    };
                }
                // Use Case 6: Document Analysis (Smart Hub)
                else if (lowerContent.includes('analyze') || lowerContent.includes('upload') || lowerContent.includes('pdf')) {
                    responseText = "I've analyzed the uploaded document. Extracted 21 items. 18 Validated, 3 Need Review.";
                    responseArtifact = {
                        id: 'art_asset_review_01',
                        type: 'asset_review',
                        title: 'Asset Review: Invoice.pdf',
                        data: {
                            fileName: 'Invoice_Jan2026.pdf',
                            assets: [
                                {
                                    id: '1',
                                    description: 'Executive Task Chair',
                                    sku: 'CHAIR-EXEC-2024',
                                    qty: 150,
                                    unitPrice: 895.00,
                                    totalPrice: 134250.00,
                                    status: 'review',
                                    issues: ['Unusual quantity for this SKU', 'Price variance (>10%)']
                                },
                                {
                                    id: '2',
                                    description: 'Conf Chair (Leather)',
                                    sku: 'CHR-CONF-LTH',
                                    qty: 8,
                                    unitPrice: 850.00,
                                    totalPrice: 6800.00,
                                    status: 'review',
                                    issues: ['Needs review']
                                },
                                {
                                    id: '3',
                                    description: 'Height Adjustable Workstation',
                                    sku: 'DESK-ELECTRIC-7230',
                                    qty: 95,
                                    unitPrice: 1250.00,
                                    totalPrice: 118750.00,
                                    status: 'suggestion',
                                    suggestion: {
                                        sku: 'DESK-ELECTRIC-7230-BUDGET',
                                        price: 1100.00,
                                        reason: 'Budget alternative available (Save $150/unit)'
                                    }
                                },
                                {
                                    id: '4',
                                    description: 'Ergonomic Office Chair',
                                    sku: 'CHAIR-ERG-001',
                                    qty: 85,
                                    unitPrice: 425.00,
                                    totalPrice: 36125.00,
                                    status: 'validated'
                                }
                            ]
                        },
                        source: 'Smart Quote Hub'
                    };
                }
                // Use Case 7: Connect ERP
                else if (lowerContent.includes('connect') || lowerContent.includes('erp')) {
                    responseText = "Select an ERP system to connect for automated order processing.";
                    responseArtifact = {
                        id: 'art_erp_connect',
                        type: 'erp_connect_modal',
                        title: 'Connect ERP System',
                        data: { systems: ['NetSuite', 'QuickBooks', 'SAP'] },
                        source: 'Smart Quote Hub'
                    };
                }
                // Use Case 8: Process PO (from ERP Dashboard)
                else if (lowerContent.includes('processing po') || lowerContent.includes('fetching line items')) {
                    responseText = "PO Data Retrieved. 42 Line Items. 3 Issues Detected.";
                    responseArtifact = {
                        id: 'art_asset_review_erp',
                        type: 'asset_review',
                        title: 'Asset Processing: PO-AT-0004732',
                        data: {
                            source: 'ERP',
                            poNumber: 'PO-AT-0004732',
                            assets: [
                                {
                                    id: '1',
                                    description: 'Executive Task Chair',
                                    sku: 'CHAIR-EXEC-2024',
                                    qty: 150,
                                    unitPrice: 895.00,
                                    totalPrice: 134250.00,
                                    status: 'review',
                                    issues: ['Unusual quantity for this SKU', 'Price variance (>10%)']
                                }
                                // ... more sample data or just reuse state in component
                            ]
                        },
                        source: 'ERP Integration'
                    };
                }
                // Use Case 9: Browse Catalog
                else if (lowerContent.includes('catalog') || lowerContent.includes('browse')) {
                    responseText = "Opening the digital catalog. I've highlighted trending items for Office layouts.";
                    responseArtifact = {
                        id: 'art_catalog_browse',
                        type: 'asset_review', // reusing asset review for selection
                        title: 'Digital Catalog: Standard Collection',
                        data: {
                            fileName: 'Catalog_Selection_Session.active',
                            assets: [
                                {
                                    id: 'cat1',
                                    description: 'Standard Desk (60")',
                                    sku: 'DSK-STD-60',
                                    qty: 1,
                                    unitPrice: 450.00,
                                    totalPrice: 450.00,
                                    status: 'validated'
                                },
                                {
                                    id: 'cat2',
                                    description: 'ErgoChair Pro',
                                    sku: 'CHR-ERG-PRO',
                                    qty: 1,
                                    unitPrice: 650.00,
                                    totalPrice: 650.00,
                                    status: 'validated'
                                },
                                {
                                    id: 'cat3',
                                    description: 'Monitor Arm (Dual)',
                                    sku: 'ACC-MON-DL',
                                    qty: 1,
                                    unitPrice: 120.00,
                                    totalPrice: 120.00,
                                    status: 'validated'
                                }
                            ]
                        },
                        source: 'Catalog'
                    };
                }

                // --- Dashboard Integrations ---

                // Dashboard: Renew Quote
                else if (lowerContent.includes('quote #qt-2941') || lowerContent.includes('renew quote')) {
                    responseText = "I've drafted a renewal for Quote #QT-2941 (Office Expansion). I updated pricing to current rates.";
                    responseArtifact = {
                        id: 'art_renew_qt2941',
                        type: 'quote_proposal',
                        title: 'Renewal: Quote #QT-2941',
                        data: { client: 'Acme Corp', style: 'Office Expansion', total: '$12,450' },
                        source: 'Urgent Actions',
                        link: '/quotes/QT-2941'
                    };
                }
                // Dashboard: Low Stock / Stock Alert
                else if (lowerContent.includes('stock alert') || lowerContent.includes('ergonomic chair') || lowerContent.includes('restock')) {
                    responseText = "I found 50 units of Ergonomic Chair (Black) available at the secondary warehouse. Initiating transfer?";
                    responseArtifact = {
                        id: 'art_stock_ergo',
                        type: 'stock_matrix',
                        title: 'Stock Transfer: Ergo Chair',
                        data: { item: 'Ergonomic Chair (Black)', qty: 50, location: 'Secondary Warehouse', canPickup: true },
                        source: 'Urgent Actions',
                        link: '/inventory/EC-2024-BLK'
                    };
                }
                // Dashboard: Discrepancy
                else if (lowerContent.includes('shipping logs') || lowerContent.includes('discrepancy') || lowerContent.includes('resolve')) {
                    responseText = "I analyzed the shipping logs for #OR-9823. The weight matches a partial shipment, not the full order.";
                    responseArtifact = {
                        id: 'art_correct_9823',
                        type: 'order_correction',
                        title: 'Discrepancy Analysis #OR-9823',
                        data: { orderId: '9823', originalItem: 'Bulk Shipment', issue: 'Weight Mismatch', suggestion: 'Flag as Partial Delivery' },
                        source: 'Recent Activity',
                        link: '/orders/OR-9823'
                    };
                }
                // Dashboard: Approve Order (Simple Text)
                else if (lowerContent.includes('approve order') || lowerContent.includes('#or-999')) {
                    responseText = "Order #OR-999 has been approved and moved to fulfillment. I've notified the warehouse.";
                }
                // Dashboard: Approve Order
                else if (lowerContent.includes('approve') && lowerContent.includes('#or-999')) {
                    responseText = "Order #OR-999 has been successfully approved and released to production. Notification sent to the client.";
                    responseArtifact = {
                        id: 'art_approve_999',
                        type: 'text', // Simple confirmation
                        title: 'Approval Confirmed',
                        data: { message: 'Order #OR-999 Approved' }
                    };
                }

                // Use Case: Quote Created (from Asset Review Success)
                else if (lowerContent.includes('order submission confirmed') || lowerContent.includes('dashboard updated')) {
                    responseText = "I've generated the official PDF proposal for the approved assets. You can download or email it now.";
                    responseArtifact = {
                        id: 'art_proposal_final',
                        type: 'quote_proposal',
                        title: 'Proposal: Asset Selection',
                        data: { client: 'Client Generic', style: 'Corporate Standard', total: '$115,450' },
                        source: 'Asset Review',
                        link: '/quotes/QT-NEW'
                    };
                }

                const systemMsg: StreamMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'system',
                    content: responseText,
                    timestamp: new Date(),
                    artifact: responseArtifact
                };

                setMessages(prev => [...prev, systemMsg]);
                setIsGenerating(false);
            }, 1500); // 1.5s delay to simulate "thinking"
        }
    };

    const clearStream = () => {
        setMessages([]);
    };

    return (
        <GenUIContext.Provider value={{ messages, isGenerating, isStreamOpen, showTriggers, sendMessage, clearStream, toggleStream, setStreamOpen, setShowTriggers, navigate }}>
            {children}
        </GenUIContext.Provider>
    );
};

export const useGenUI = () => {
    const context = useContext(GenUIContext);
    if (context === undefined) {
        throw new Error('useGenUI must be used within a GenUIProvider');
    }
    return context;
};
