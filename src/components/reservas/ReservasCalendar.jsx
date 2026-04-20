import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export const ReservasCalendar = ({ reservas }) => {
  const events = reservas.map((res) => ({
    id: res.id,
    title: `${res.vehiculo_placa} - ${res.empleado_nombre}`,
    start: res.fecha_inicio,
    end: res.fecha_fin,
    backgroundColor: res.estado === "En Uso" ? "#ef4444" : "#3b82f6",
    extendedProps: { estado: res.estado },
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      locale="es"
      // Bloquear fechas visualmente al hacer clic en un día ocupado
      dateClick={(info) => console.log("Día seleccionado:", info.dateStr)}
      eventClick={(info) => {
        if (
          ["En Uso", "Finalizado"].includes(info.event.extendedProps.estado)
        ) {
          alert("Esta reserva no se puede editar por su estado.");
        }
      }}
    />
  );
};
