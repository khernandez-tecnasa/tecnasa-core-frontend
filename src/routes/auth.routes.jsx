import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Auth/Login";
// import Register from "@/pages/Auth/Register";
// import RecoverPassword from "@/pages/Auth/RecoverPassword";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      {/* <Route path="register" element={<Register />} />
      <Route path="recover-password" element={<RecoverPassword />} /> */}
      {/* Puedes agregar más subrutas aquí */}
    </Routes>
  );
}
