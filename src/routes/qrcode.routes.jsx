// src/routes/qrcode.routes.jsx
import { Routes, Route } from "react-router-dom";
import PublicActivoPage from "../pages/Public/PublicActivoPage";
import TrackingVehiculos from "../pages/Public/TrackingVehiculos";

export default function QrcodeRoutes() {
  return (
    <Routes>
      {/* SIN slash inicial: relativa a /public/* */}
      <Route path="activos/:codigo" element={<PublicActivoPage />} />
      <Route path="tracking" element={<TrackingVehiculos />} />
    </Routes>
  );
}
