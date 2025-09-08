import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom"; // 👈 thêm dòng này

const ProtectedRoute = ({ children, role }) => {
  const { user } = useSelector((state) => state.auth);

  // Nếu chưa login hoặc role không khớp
  if (!user || (role && user.role !== role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
