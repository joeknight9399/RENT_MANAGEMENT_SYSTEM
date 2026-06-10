import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export default function UnitsPage() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);

    const [editingUnit, setEditingUnit] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [billingForm, setBillingForm] = useState({
        water_billing_flow: 'Flat',
        electricity_billing_flow: 'Prepaid Token',
        garbage_fee: 0,
        water_flat_rate: 0
    });

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/units');
            setUnits(res.data.data.units);
        } catch (err) {
            toast.error('Failed to load units.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/admin/units/${id}/status`, { status });
            toast.success(`Unit updated to ${status}`);
            fetchUnits();
        } catch (err) {
            toast.error('Failed to update unit status.');
        }
    };

    const openBillingModal = (unit) => {
        setEditingUnit(unit);

        setBillingForm({
            water_billing_flow: unit.water_billing_flow || 'Flat',
            electricity_billing_flow:
                unit.electricity_billing_flow || 'Prepaid Token',
            garbage_fee: unit.garbage_fee || 0,
            water_flat_rate: unit.water_flat_rate || 0
        });
    };

    const handleBillingSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitLoading(true);

            await api.patch(
                `/admin/units/${editingUnit.id}/billing`,
                billingForm
            );

            toast.success(
                `Billing settings updated for Room ${editingUnit.room_number}`
            );

            setEditingUnit(null);
            fetchUnits();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to save billing settings.'
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Vacant':
                return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';

            case 'Occupied':
                return 'bg-sky-500/10 text-sky-300 border border-sky-500/20';

            default:
                return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Units
                </h1>

                <p className="text-sm text-slate-400 mt-2">
                    Manage rental units, occupancy status and utility settings.
                </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-950 border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Unit
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Property
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Type
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Rent
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Deposit
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Utilities
                            </th>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Status
                            </th>
                            <th className="p-4 text-right text-xs font-semibold text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="text-center p-10 text-slate-500"
                                >
                                    Loading units...
                                </td>
                            </tr>
                        ) : (
                            units.map((unit) => (
                                <tr
                                    key={unit.id}
                                    className="hover:bg-slate-800/40 transition-colors"
                                >
                                    <td className="p-4 font-semibold text-white">
                                        {unit.room_number}
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        {unit.property_name || (
                                            <span className="text-slate-500 italic">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        {unit.category}
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        Ksh {unit.base_rent?.toLocaleString()}
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        Ksh {unit.deposit_amount?.toLocaleString()}
                                    </td>

                                    <td className="p-4 text-xs space-y-1">
                                        <div className="text-slate-400">
                                            Water:{' '}
                                            <span className="text-slate-200">
                                                {unit.water_billing_flow || 'Flat'}
                                            </span>
                                        </div>

                                        <div className="text-slate-400">
                                            Electricity:{' '}
                                            <span className="text-slate-200">
                                                {unit.electricity_billing_flow ||
                                                    'Prepaid Token'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                                unit.status
                                            )}`}
                                        >
                                            {unit.status}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() =>
                                                openBillingModal(unit)
                                            }
                                            className="px-3 py-1.5 text-xs rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition"
                                        >
                                            Utilities
                                        </button>

                                        {unit.status !== 'Maintenance' && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        unit.id,
                                                        'Maintenance'
                                                    )
                                                }
                                                className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition"
                                            >
                                                Maintenance
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    unit.id,
                                                    'Vacant'
                                                )
                                            }
                                            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                                        >
                                            Mark Vacant
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                        Loading units...
                    </div>
                ) : (
                    units.map((unit) => (
                        <div
                            key={unit.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">
                                        Unit {unit.room_number}
                                    </h3>

                                    <p className="text-sm text-slate-400">
                                        {unit.property_name || 'Unassigned'}
                                    </p>
                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                        unit.status
                                    )}`}
                                >
                                    {unit.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-slate-500">
                                        Type
                                    </p>

                                    <p className="text-slate-200 mt-1">
                                        {unit.category}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">
                                        Rent
                                    </p>

                                    <p className="text-slate-200 mt-1">
                                        Ksh{' '}
                                        {unit.base_rent?.toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">
                                        Deposit
                                    </p>

                                    <p className="text-slate-200 mt-1">
                                        Ksh{' '}
                                        {unit.deposit_amount?.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4">
                                <p className="text-xs font-medium text-slate-400 mb-2">
                                    Utility Settings
                                </p>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">
                                        Water Billing
                                    </span>

                                    <span className="text-slate-200">
                                        {unit.water_billing_flow || 'Flat'}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-slate-500">
                                        Electricity Billing
                                    </span>

                                    <span className="text-slate-200">
                                        {unit.electricity_billing_flow ||
                                            'Prepaid Token'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => openBillingModal(unit)}
                                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium py-2 rounded-xl transition"
                                >
                                    Utilities
                                </button>

                                {unit.status !== 'Maintenance' ? (
                                    <button
                                        onClick={() =>
                                            updateStatus(
                                                unit.id,
                                                'Maintenance'
                                            )
                                        }
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 rounded-xl transition"
                                    >
                                        Maintenance
                                    </button>
                                ) : (
                                    <div className="bg-slate-800 text-slate-400 text-xs rounded-xl flex items-center justify-center">
                                        Active
                                    </div>
                                )}

                                <button
                                    onClick={() =>
                                        updateStatus(
                                            unit.id,
                                            'Vacant'
                                        )
                                    }
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded-xl transition"
                                >
                                    Vacant
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Billing Modal */}
            {editingUnit && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Utility Settings
                                </h3>

                                <p className="text-sm text-slate-400">
                                    Room {editingUnit.room_number}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setEditingUnit(null)
                                }
                                className="text-slate-500 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleBillingSubmit}
                            className="p-5 space-y-5"
                        >
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Water Billing Method
                                </label>

                                <select
                                    value={billingForm.water_billing_flow}
                                    onChange={(e) =>
                                        setBillingForm({
                                            ...billingForm,
                                            water_billing_flow:
                                                e.target.value
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                                >
                                    <option value="Metered">
                                        Metered
                                    </option>
                                    <option value="Flat">
                                        Flat Rate
                                    </option>
                                    <option value="Prepaid Token">
                                        Prepaid Token
                                    </option>
                                </select>
                            </div>

                            {billingForm.water_billing_flow ===
                                'Flat' && (
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Water Flat Rate (Ksh)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={billingForm.water_flat_rate}
                                            onChange={(e) =>
                                                setBillingForm({
                                                    ...billingForm,
                                                    water_flat_rate:
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                })
                                            }
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                                        />
                                    </div>
                                )}

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Electricity Billing Method
                                </label>

                                <select
                                    value={
                                        billingForm.electricity_billing_flow
                                    }
                                    onChange={(e) =>
                                        setBillingForm({
                                            ...billingForm,
                                            electricity_billing_flow:
                                                e.target.value
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                                >
                                    <option value="Prepaid Token">
                                        Prepaid Token
                                    </option>
                                    <option value="Metered">
                                        Metered
                                    </option>
                                    <option value="Flat">
                                        Flat Rate
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Garbage Collection Fee (Ksh)
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={billingForm.garbage_fee}
                                    onChange={(e) =>
                                        setBillingForm({
                                            ...billingForm,
                                            garbage_fee:
                                                parseFloat(
                                                    e.target.value
                                                ) || 0
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditingUnit(null)
                                    }
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-3 rounded-xl transition"
                                >
                                    {submitLoading
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}