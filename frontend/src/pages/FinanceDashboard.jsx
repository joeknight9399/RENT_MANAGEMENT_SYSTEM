import React, { useState, useEffect, useCallback } from 'react';
import api from '../api'; // 🌟 Points directly to your dynamic Axios engine

const FinanceDashboard = () => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const [summary, setSummary] = useState(null);
    const [ledgerMatrix, setLedgerMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardened fetch operation utilizing the unified Axios client
    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Axios prepends baseURL, appends authorization headers, and parses JSON automatically
            const response = await api.get(`/finance/summary?month=${selectedMonth}`);

            // Axios nests the server payload directly inside the data key
            const serverPayload = response.data;

            if (serverPayload && serverPayload.status === 'Success') {
                setSummary(serverPayload.data?.summary || null);
                setLedgerMatrix(serverPayload.data?.ledger || []);
            } else {
                setSummary(null);
                setLedgerMatrix([]);
                setError('Received unexpected operational matrix format from backend node.');
            }
        } catch (err) {
            console.error('Ledger Fetch Error:', err);

            // Defensive check to handle raw HTML fallbacks elegantly
            if (err.response && typeof err.response.data === 'string' && err.response.data.includes('<!doctype')) {
                setError('Error connecting to root operational database node layers (HTML Fallback Error).');
            } else {
                setError(err.response?.data?.message || 'Network connection bottleneck detected. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Financial Metrics Hub</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Real-time collections ledger matrix and billing overview</p>
                </div>
                <div>
                    <label htmlFor="month-picker" style={{ marginRight: '8px', fontWeight: '500', color: '#374151' }}>Operational Month:</label>
                    <input
                        id="month-picker"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' }}>
                    <p style={{ margin: 0, fontWeight: '600' }}>⚠️ System Alert</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{error}</p>
                </div>
            )}

            {/* Loader State */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#4b5563' }}>
                    <p style={{ fontWeight: '500' }}>Compiling network ledger metrics...</p>
                </div>
            ) : (
                <>
                    {/* Financial Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, uppercase: 'true' }}>Expected Invoicing</p>
                            <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#111827' }}>KES {summary?.totalExpected?.toLocaleString() || 0}</h3>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Total Collected</p>
                            <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#10b981' }}>KES {summary?.totalCollected?.toLocaleString() || 0}</h3>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #ef4444' }}>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Outstanding Arrears</p>
                            <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#ef4444' }}>KES {summary?.totalPending?.toLocaleString() || 0}</h3>
                        </div>
                    </div>

                    {/* Collection Ledger Matrix Grid */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>Collection Ledger Matrix</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Property Node</th>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Unit</th>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Tenant Structural Index</th>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Billed Amount</th>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Paid Amount</th>
                                        <th style={{ padding: '12px 20px', color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>Ledger Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerMatrix.length > 0 ? (
                                        ledgerMatrix.map((record, index) => (
                                            <tr key={record.id || index} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '16px 20px', color: '#111827', fontSize: '14px', fontWeight: '500' }}>{record.propertyName}</td>
                                                <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: '14px' }}>{record.unitName}</td>
                                                <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: '14px' }}>{record.tenantName || 'Vacant Matrix Index'}</td>
                                                <td style={{ padding: '16px 20px', color: '#111827', fontSize: '14px' }}>KES {record.amountBilled?.toLocaleString()}</td>
                                                <td style={{ padding: '16px 20px', color: '#111827', fontSize: '14px' }}>KES {record.amountPaid?.toLocaleString()}</td>
                                                <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        backgroundColor: record.status === 'Paid' ? '#d1fae5' : record.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                                                        color: record.status === 'Paid' ? '#065f46' : record.status === 'Partial' ? '#92400e' : '#991b1b'
                                                    }}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '32px 20px', textCol: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                                                No financial ledger transactions maps found for the specified operational window.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FinanceDashboard;