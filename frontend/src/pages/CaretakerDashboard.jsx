import React, { useState } from 'react';
import PendingMoveIns from './PendingMoveIns';
import UtilityLogger from './UtilityLogger';

export default function CaretakerDashboard() {
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Callback that fires whenever a move-in completes successfully
    const handleMoveInSuccess = () => {
        // Incrementing this value triggers the utility view dropdown to query MySQL instantly
        setRefreshCounter(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-[#070708] text-slate-300 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Header Navigation Section */}
            <header className="max-w-6xl mx-auto mb-8 border-b border-slate-900 pb-5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <h1 className="text-lg font-black text-white uppercase tracking-wider">Caretaker Control Station</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Property Management System • Field Operations Suite</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">Terminal Local</p>
                    <p className="text-[10px] text-slate-600 font-mono uppercase tracking-tight">Status: Sync Established</p>
                </div>
            </header>

            {/* Core Application Grid Matrix */}
            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Flight Column: Pending Action lists */}
                <section className="lg:col-span-7 space-y-6">
                    <PendingMoveIns onMoveInSuccess={handleMoveInSuccess} />

                    {/* Placeholder container showing where maintenance ticks or announcements fit */}
                    <div className="p-5 border border-slate-900 rounded-xl bg-[#111]/40 text-center text-xs text-slate-600 border-dashed">
                        Maintenance ticket assignment and property announcement logs can be tracked directly within this main console panel layout.
                    </div>
                </section>

                {/* Right Flight Column: Utility Meters entry fields */}
                <section className="lg:col-span-5">
                    <UtilityLogger refreshTrigger={refreshCounter} />
                </section>
            </main>
        </div>
    );
}