// src/pages/HelpPage/HelpPage.jsx
// Este componente redirige al nuevo Centro de Ayuda.
// La funcionalidad fue migrada a páginas dedicadas:
//   /admin/help           → HelpHome
//   /admin/help/faqs      → HelpFaqsList
//   /admin/help/tutorials → HelpTutorialsList
//   /admin/help/changelog → HelpChangelogList
//   /admin/help/status    → HelpStatusPage
import { Navigate } from "react-router-dom";

export default function HelpPage() {
  return <Navigate to="/admin/help" replace />;
}
