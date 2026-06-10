import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalData, setModalData] = useState({
        isOpen: false,
        user: null
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data.data.users);
        } catch (err) {
            toast.error('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const handleEvict = async () => {
        const { user } = modalData;

        setModalData({
            isOpen: false,
            user: null
        });

        try {
            setLoading(true);

            await api.delete(`/admin/tenants/${user.id}`, {
                data: {
                    unit_id: user.unit_id
                }
            });

            toast.success(
                `${user.full_name} has been removed successfully.`
            );

            fetchUsers();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to remove tenant.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (user, newStatus) => {
        try {
            setLoading(true);

            if (
                user.status === 'Pending' &&
                newStatus === 'Active'
            ) {
                await api.patch(
                    `/admin/verify-tenant/${user.id}`
                );

                toast.success(
                    `${user.full_name} has been verified successfully.`
                );
            } else {
                await api.patch(
                    `/admin/users/${user.id}/update-status`,
                    { status: newStatus }
                );

                toast.success(
                    `Status updated to ${newStatus}.`
                );
            }

            fetchUsers();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to update status.'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.full_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            (user.room_number &&
                user.room_number
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'text-emerald-300';
            case 'Suspended':
                return 'text-red-300';
            case 'Inactive':
                return 'text-slate-400';
            case 'Pending':
                return 'text-amber-300';
            default:
                return 'text-slate-300';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

            <ConfirmationModal
                isOpen={modalData.isOpen}
                onClose={() =>
                    setModalData({
                        isOpen: false,
                        user: null
                    })
                }
                onConfirm={handleEvict}
                message={`Are you sure you want to remove ${modalData.user?.full_name}? This will mark their room as vacant.`}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Users
                    </h1>

                    <p className="text-sm text-slate-400 mt-2">
                        Manage tenants, caretakers and administrators.
                    </p>
                </div>

                <input
                    type="text"
                    placeholder="Search by name or room..."
                    value={searchQuery}
                    onChange={(e) =>
                        setSearchQuery(e.target.value)
                    }
                    className="
                        w-full md:w-80
                        bg-slate-900
                        border border-slate-700
                        rounded-xl
                        px-4 py-3
                        text-sm
                        text-slate-200
                        focus:outline-none
                        focus:border-indigo-500
                        transition
                    "
                />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

                <table className="w-full text-sm">
                    <thead className="bg-slate-950 border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Name
                            </th>

                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Contact
                            </th>

                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Role
                            </th>

                            <th className="p-4 text-left text-xs font-semibold text-slate-400">
                                Room
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

                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-slate-800/40 transition-colors"
                                >
                                    <td className="p-4">
                                        <p className="font-medium text-white">
                                            {user.full_name}
                                        </p>
                                    </td>

                                    <td className="p-4">
                                        <p className="text-slate-300">
                                            {user.email}
                                        </p>

                                        <p className="text-xs text-slate-500 mt-1">
                                            {user.phone_number}
                                        </p>
                                    </td>

                                    <td className="p-4">
                                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full">
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        {user.room_number ? (
                                            `Room ${user.room_number}`
                                        ) : (
                                            <span className="italic text-slate-500">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        <select
                                            value={user.status}
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    user,
                                                    e.target.value
                                                )
                                            }
                                            disabled={loading}
                                            className={`
                                                bg-slate-950
                                                border border-slate-700
                                                rounded-lg
                                                px-3 py-2
                                                text-sm
                                                font-medium
                                                focus:outline-none
                                                ${getStatusColor(user.status)}
                                            `}
                                        >
                                            <option value="Active">
                                                Active
                                            </option>
                                            <option value="Inactive">
                                                Inactive
                                            </option>
                                            <option value="Suspended">
                                                Suspended
                                            </option>
                                            <option value="Pending">
                                                Pending
                                            </option>
                                        </select>
                                    </td>

                                    <td className="p-4 text-right">
                                        {user.role === 'Tenant' && (
                                            <button
                                                onClick={() =>
                                                    setModalData({
                                                        isOpen: true,
                                                        user
                                                    })
                                                }
                                                disabled={loading}
                                                className="
                                                    bg-red-500/10
                                                    border border-red-500/20
                                                    text-red-300
                                                    hover:bg-red-600
                                                    hover:text-white
                                                    px-3 py-2
                                                    rounded-lg
                                                    text-xs
                                                    font-medium
                                                    transition
                                                "
                                            >
                                                Remove Tenant
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="p-10 text-center"
                                >
                                    <p className="text-slate-400">
                                        No matching users were found.
                                    </p>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Try adjusting your search criteria.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">

                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                        >
                            <div className="flex justify-between items-start gap-3">

                                <div>
                                    <h3 className="font-semibold text-white text-base">
                                        {user.full_name}
                                    </h3>

                                    <span className="inline-block mt-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full">
                                        {user.role}
                                    </span>
                                </div>

                                <select
                                    value={user.status}
                                    onChange={(e) =>
                                        handleStatusChange(
                                            user,
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    className={`
                                        bg-slate-950
                                        border border-slate-700
                                        rounded-lg
                                        px-3 py-2
                                        text-sm
                                        font-medium
                                        ${getStatusColor(user.status)}
                                    `}
                                >
                                    <option value="Active">
                                        Active
                                    </option>
                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                    <option value="Suspended">
                                        Suspended
                                    </option>
                                    <option value="Pending">
                                        Pending
                                    </option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Email
                                    </p>

                                    <p className="text-sm text-slate-300 mt-1 break-all">
                                        {user.email}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Phone
                                    </p>

                                    <p className="text-sm text-slate-300 mt-1">
                                        {user.phone_number}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Room
                                    </p>

                                    <p className="text-sm text-slate-300 mt-1">
                                        {user.room_number
                                            ? `Room ${user.room_number}`
                                            : 'Unassigned'}
                                    </p>
                                </div>
                            </div>

                            {user.role === 'Tenant' && (
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={() =>
                                            setModalData({
                                                isOpen: true,
                                                user
                                            })
                                        }
                                        disabled={loading}
                                        className="
                                            w-full
                                            bg-red-500/10
                                            border border-red-500/20
                                            text-red-300
                                            hover:bg-red-600
                                            hover:text-white
                                            py-3
                                            rounded-xl
                                            text-sm
                                            font-medium
                                            transition
                                        "
                                    >
                                        Remove Tenant
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <p className="text-slate-400">
                            No matching users were found.
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                            Try adjusting your search criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}