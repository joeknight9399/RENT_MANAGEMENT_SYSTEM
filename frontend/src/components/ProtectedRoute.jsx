import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Custom hook for auth context

const ProtectedRoute = ({ allowedRoles }) => {
    const { token, user, loading } = useAuth();

    // Show a clean loading state while checking local storage / verifying tokens
    if (loading) {
        return <div className="loading-screen">Verifying credentials...</div>;
    }

    // No token? Bounce to login screen
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Token exists but role doesn't match? Bounce to unauthorized or login page
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Authorized! Render the nested child views safely via the Router Outlet
    return <Outlet />;
};

export default ProtectedRoute;