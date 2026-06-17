import { useEffect, useState } from "react";
import {
  ListarVehiculosEmpleado,
  getVehiculoPublicInfo,
} from "@/services/VehiculosService";
import { useAuth } from "@/context/AuthContext";
import { Car, ChevronDown } from "lucide-react";

export default function OperacionVehiculo({ onSelect, preselectId = null }) {
  const { userData } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const hoy = new Date().toISOString().slice(0, 10);

  const disponible = (v) => {
    if (v.estado === "En Uso") return false;
    if (v.reserva) {
      const inicio = v.reserva.fecha_inicio.slice(0, 10);
      const fin = v.reserva.fecha_fin.slice(0, 10);
      const esHoy = hoy >= inicio && hoy <= fin;
      if (esHoy && v.reserva.empleado_id !== userData.id) return false;
    }
    return true;
  };

  useEffect(() => {
    const load = async () => {
      const data = await ListarVehiculosEmpleado(userData.id);
      let list = Array.isArray(data) ? data : [];

      // Si venimos desde un QR con vehículo preseleccionado y no está en
      // la lista del empleado (otra ciudad, etc.), lo traemos por su info
      // pública para poder seleccionarlo igual.
      const idNum = preselectId != null ? Number(preselectId) : null;
      if (idNum && !list.some((v) => v.id === idNum)) {
        try {
          const info = await getVehiculoPublicInfo(idNum);
          if (info) list = [...list, info];
        } catch {
          // si falla, simplemente no se preselecciona
        }
      }

      setVehiculos(list);

      // Autoseleccionar el vehículo del QR
      if (idNum) {
        const match = list.find((v) => v.id === idNum);
        if (match) {
          setSelectedId(String(idNum));
          onSelect(match);
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.id, preselectId]);

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        Unidad Asignada
      </label>
      <div className="relative">
        <Car
          size={15}
          className="text-muted-foreground pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        />
        <select
          value={selectedId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedId(val);
            onSelect(vehiculos.find((v) => v.id == val));
          }}
          className="w-full pl-10 pr-9 py-2.5 text-sm font-medium bg-background dark:bg-slate-900/60 border border-border rounded-xl transition-all cursor-pointer appearance-none text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          <option value="">Seleccione una unidad...</option>
          {vehiculos.filter(disponible).map((v) => (
            <option key={v.id} value={v.id}>
              {v.placa}
              {v.estado === "Reservado"
                ? v.reserva && v.reserva.empleado_id === userData.id
                  ? " — Reservado para ti"
                  : " — Reservado"
                : v.estado === "En Uso"
                  ? " — En uso"
                  : " — Disponible"}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="text-muted-foreground pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
