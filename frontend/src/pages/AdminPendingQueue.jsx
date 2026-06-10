import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AdminPendingQueue() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState(null); // Tracks which specific user row is processing
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    // 1. Fetch all users stuck in the pending processing queue
    const fetchPendingQueue = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/v1/admin/users/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 'Success') {
                setUsers(response.data.data.users);
            }
        } catch (error) {
            console.error('Failed to fetch approval queue:', error);
            setFeedback({
                message: error.response?.data?.message || 'Failed to sync with administration server.',
                type: 'text-rose-400 border-rose-500/30 bg-rose-950/10'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPendingQueue();
    }, [token]);

    // 2. Dispatch administrative decision (Approve / Reject)
    const handleDecision = async (userId, action) => {
        setActioningId(userId);
        setFeedback({ message: '', type: '' });

        try {
            const response = await axios.patch(
                `http://localhost:5000/api/v1/admin/users/${userId}/status`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'Success') {
                setFeedback({
                    message: response.data.message,
                    type: action === 'Approve'
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10'
                        : 'text-amber-400 border-amber-500/30 bg-amber-950/10'
                });
                // Optimistically remove the handled user from the UI matrix
                setUsers(users.filter(user => user.id !== userId));
            }
        } catch (error) {
            console.error(`Administrative action (${action}) failed:`, error);
            setFeedback({
                message: error.response?.data?.message || 'Transaction sequencing failed.',
                type: 'text-rose-400 border-rose-500/30 bg-rose-950/10'
            });
        } finally {
            setActioningId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-100 p-6 md:p-12 font-sans">
            {/* Context Heading */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
                        APPROVAL PROCESSING GATEWAY
                    </h1>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">
                        Keja Digital Operational Clearance Core
                    </p>
                </div>
                <div className="mt-4 md:mt-0 text-xs px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-950/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                    Active Registrations in Queue: <span className="font-bold">{users.length}</span>
                </div>
            </div>

            {/* Global Context System Feedback Alerts */}
            {feedback.message && (
                <div className={`mb-6 p-4 rounded-xl text-xs border backdrop-blur-md transition-all duration-300 ${feedback.type}`}>
                    {feedback.message}
                </div>
            )}

            {/* Main Interactive Data Matrix */}
            {loading ? (
                <div className="flex justify-center items-center h-64 text-cyan-400 text-sm tracking-widest animate-pulse">
                    SYNCHRONIZING SECURE ACCOUNT QUEUES...
                </div>
            ) : users.length === 0 ? (
                <div className="border border-slate-900 bg-[#0a0a0a] rounded-2xl p-12 text-center text-slate-500 text-sm">
                    No pending registration configurations detected inside the structural buffer.
                </div>
            ) : (
                <div className="border border-slate-900 bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-900 bg-[#0e0e0e] text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 pl-6">Applicant Node</th>
                                    <th className="p-4">Contact Channels</th>
                                    <th className="p-4">Identity Core</th>
                                    <th className="p-4">System Assignment</th>
                                    <th className="p-4 text-center pr-6">Operational Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-xs">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-900/20 transition-all duration-200">
                                        {/* Name Block */}
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-slate-200 text-sm">{user.full_name}</div>
                                            <div className="text-[10px] text-slate-600 mt-0.5">UID: {user.id}</div>
                                        </td>
                                        {/* Contact Vectors */}
                                        <td className="p-4">
                                            <div className="text-slate-300">{user.email}</div>
                                            <div className="text-slate-500 mt-0.5">{user.phone_number}</div>
                                        </td>
                                        {/* Legal Verification Specs */}
                                        <td className="p-4 font-mono text-slate-400 tracking-wider">
                                            Nat. ID: {user.national_id}
                                        </td>
                                        {/* System Layout Target Role */}
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wide text-[10px] ${user.role === 'Caretaker'
                                                ? 'bg-purple-950/40 text-purple-400 border border-purple-800/30'
                                                : 'bg-blue-950/40 text-blue-400 border border-blue-800/30'
                                                }`}>
                                                {user.role}
                                            </span>
                                            {user.unit_id && (
                                                <span className="ml-2 text-slate-500 font-mono">Unit {user.unit_id}</span>
                                            )}
                                        </td>
                                        {/* Administrative Decisions Actions */}
                                        <td className="p-4 text-center pr-6 space-x-3 whitespace-nowrap">
                                            <button
                                                disabled={actioningId !== null}
                                                onClick={() => handleDecision(user.id, 'Approve')}
                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            >
                                                {actioningId === user.id ? '...' : 'APPROVE'}
                                            </button>
                                            <button
                                                disabled={actioningId !== null}
                                                onClick={() => handleDecision(user.id, 'Reject')}
                                                className="px-4 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/30 disabled:opacity-40 text-rose-400 font-bold rounded-lg transition-all"
                                            >
                                                {actioningId === user.id ? '...' : 'REJECT'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPendingQueue;