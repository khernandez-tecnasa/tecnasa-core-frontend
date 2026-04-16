import { useEffect, useState } from "react";
import { ListarVehiculosEmpleado } from "@/services/VehiculosService";
import { useAuth } from "@/context/AuthContext";
import { Car, ChevronDown } from "lucide-react";

export default function OperacionVehiculo({ onSelect }) {
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
      setVehiculos(data || []);
    };
    load();
  }, [userData.id]);

  return (
    <div
      className="
        space-y-1.5
      ">
      <label
        className="
          block
          text-[10px] font-black tracking-[0.2em] text-slate-400
          uppercase
        ">
        Unidad Asignada
      </label>
      <div
        className="
          relative
        ">
        <Car
          size={16}
          className="
            text-slate-400
            pointer-events-none
            absolute left-3.5 top-1/2 -translate-y-1/2
          "
        />
        <select
          value={selectedId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedId(val);
            onSelect(vehiculos.find((v) => v.id == val));
          }}
          className="
            w-full
            pl-10 pr-9 py-3
            text-sm font-semibold text-slate-700
            bg-slate-50
            border border-slate-200 rounded-xl
            transition-all cursor-pointer
            appearance-none dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
          ">
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
          size={15}
          className="
            text-slate-400
            pointer-events-none
            absolute right-3.5 top-1/2 -translate-y-1/2
          "
        />
      </div>
    </div>
  );
}
