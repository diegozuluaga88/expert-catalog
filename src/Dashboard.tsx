
import { useState } from 'react';
import BusinessHealthHeader from './components/dashboard/business-health/BusinessHealthHeader';
import StatsRow from './components/dashboard/business-health/StatsRow';

import SalesChart from './components/dashboard/business-health/SalesChart';
import CategoriesChart from './components/dashboard/business-health/CategoriesChart';
import InventoryHealthList from './components/dashboard/business-health/InventoryHealthList';
import RevenueDetail from './components/dashboard/business-health/RevenueDetail';
import OrdersDetail from './components/dashboard/business-health/OrdersDetail';
import InventoryDetail from './components/dashboard/business-health/InventoryDetail';
import InquiriesDetail from './components/dashboard/business-health/InquiriesDetail';

export default function Dashboard() {
    const [activeStatId, setActiveStatId] = useState<number | null>(null);

    const handleStatClick = (id: number) => {
        setActiveStatId(prev => prev === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans section-transition relative pb-24">
            <div className="pt-24 px-4 max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <BusinessHealthHeader />

                {/* KPI Stats */}
                <div className="relative mb-6">
                    <StatsRow activeStatId={activeStatId} onStatClick={handleStatClick} />

                    {activeStatId && (
                        <div className="mt-6">
                            {activeStatId === 1 && <RevenueDetail className="rounded-tl-none" />}
                            {activeStatId === 2 && <OrdersDetail />}
                            {activeStatId === 3 && <InventoryDetail />}
                            {activeStatId === 4 && <InquiriesDetail className="rounded-tr-none" />}
                        </div>
                    )}
                </div>



                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px]">
                        <SalesChart />
                    </div>
                    <div className="h-[400px]">
                        <CategoriesChart />
                    </div>
                </div>

                {/* Inventory Health */}
                <InventoryHealthList />



            </div>
        </div>
    );
}
