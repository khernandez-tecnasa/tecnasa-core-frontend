export default function OperacionResumen({
  vehiculo,
  operacionActiva,
  reservaActiva,
}) {
  return (
    <div className="bg-muted p-4 rounded-xl space-y-2">
      <p className="font-semibold">{vehiculo.placa}</p>

      {operacionActiva ? (
        <p className="text-red-500 text-sm">
          En uso desde {new Date(operacionActiva.fecha_salida).toLocaleString()}
        </p>
      ) : (
        <p className="text-green-600 text-sm">Disponible</p>
      )}

      {reservaActiva && (
        <div className="text-xs text-amber-600">
          <p>Reserva activa</p>
          <p>
            {new Date(reservaActiva.fecha_inicio).toLocaleDateString()} -{" "}
            {new Date(reservaActiva.fecha_fin).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
