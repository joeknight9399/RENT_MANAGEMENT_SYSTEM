import React, { useState, useEffect } from 'react';
import api from '../api'; // Centralized Axios instance

function CaretakerTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Fetch tickets from our centralized API endpoint (Cleaned relative path)
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/caretaker/tickets');
            if (response.data.status === 'Success') {
                setTickets(response.data.data);
            }
        } catch (err) {
            console.error('[FETCH_TICKETS_UI_ERROR]:', err);
            setError('Failed to load maintenance tickets.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // 2. Handle updating the status of a ticket (Cleaned relative path)
    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            const response = await api.patch(`/caretaker/tickets/${ticketId}`, {
                status: newStatus
            });

            if (response.data.status === 'Success') {
                // Instantly update the UI state instead of re-fetching everything
                setTickets(prevTickets =>
                    prevTickets.map(ticket =>
                        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
                    )
                );
            }
        } catch (err) {
            console.error('[UPDATE_STATUS_UI_ERROR]:', err);
            alert('Failed to update ticket status.');
        }
    };

    // Helper to get color accents for badges based on status
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-rose-950/40 text-rose-400 border-rose-500/30';
            case 'In_Progress': return 'bg-amber-950/40 text-amber-400 border-amber-500/30';
            case 'Resolved': return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
            default: return 'bg-slate-900 text-slate-400 border-slate-700';
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen p-6 font-sans text-slate-100">
            {/* Header */}
            <div className="mb-8 max-w-5xl mx-auto flex justify-between items-center border-b border-slate-900 pb-4">
                <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase">Maintenance Command Center</h1>
                    <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-0.5">Caretaker Operations Panel</p>
                </div>
                <button
                    onClick={fetchTickets}
                    className="px-3 py-1.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg text-xs transition-all"
                >
                    REFRESH FEED
                </button>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl mx-auto">
                {error && <div className="mb-4 p-3 bg-rose-950/20 text-rose-400 border border-rose-500/30 text-xs rounded-lg">{error}</div>}

                {loading ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-500 tracking-widest">LOADING TICKETS...</div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-500 tracking-widest border border-dashed border-slate-900 rounded-xl">NO ACTIVE TICKETS IN SYSTEM</div>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-[#0a0a0a] p-5 rounded-xl border border-slate-900 hover:border-indigo-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">

                                {/* Ticket Details */}
                                <div className="space-y-1.5 max-w-xl">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border rounded ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs font-bold text-cyan-400 tracking-wider">UNIT {ticket.room_number}</span>
                                        <span className="text-[10px] text-slate-600 font-mono">[{ticket.category || 'General'}]</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-200 tracking-tight uppercase">{ticket.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{ticket.description}</p>
                                </div>

                                {/* Action Controls for State Transitions */}
                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {ticket.status === 'Pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.id, 'In_Progress')}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
                                        >
                                            ACCEPT JOB
                                        </button>
                                    )}
                                    {ticket.status === 'In_Progress' && (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.id, 'Resolved')}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg shadow-lg shadow-emerald-600/10 transition-all"
                                        >
                                            RESOLVE ISSUE
                                        </button>
                                    )}
                                    {ticket.status === 'Resolved' && (
                                        <span className="text-[10px] font-mono text-emerald-500/70 border border-emerald-500/20 px-3 py-1.5 bg-emerald-950/10 rounded-lg select-none">
                                            ✓ COMPLETED
                                        </span>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CaretakerTickets;