import { useEffect, useState } from "react";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { useAuth } from "@/context/AuthContext";

export default function OperacionSelector({ onSelect }) {
  const [vehiculos, setVehiculos] = useState([]);
  const { userData, hasPermiso } = useAuth();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  console.log("vehiculos:", vehiculos);

  const canView = can("ver_vehiculos");

  useEffect(() => {
    console.log("🔥 cargando vehiculos...");
    if (!canView) return;
    const fetch = async () => {
      const data = await obtenerVehiculos();
      setVehiculos(data || []);
    };
    fetch();
  }, []);

  return (
    <select
      onChange={(e) => onSelect(vehiculos.find((v) => v.id == e.target.value))}
      className="w-full border rounded-lg p-2">
      <option value="">Selecciona vehículo</option>

      {vehiculos.map((v) => {
        const ocupado = v.estado === "En Uso";

        return (
          <option key={v.id} value={v.id} disabled={ocupado}>
            {v.placa} {ocupado ? "(En uso)" : ""}
          </option>
        );
      })}
    </select>
  );
}
