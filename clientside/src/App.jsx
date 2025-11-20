import {  Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";

export default function App() {
  return (
     <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Register/>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
