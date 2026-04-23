// src/routes/dashboard.routes.jsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import SearchResultsPage from "@/pages/Search/SearchResultsPage";
import EntityPreviewPage from "@/pages/Search/EntityPreviewPage.jsx";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Home from "@/pages/Dashboard/Home";
import Usuarios    from "@/pages/Users/Users";
import UsersList   from "@/pages/Users/UsersList";
import UsersForm   from "@/pages/Users/UsersForm";
import MyAccount from "@/pages/Users/MyAccount/MyAccount";
import Vehiculos from "@/pages/Vehiculos/Vehiculos";
import Register from "@/pages/Register/Register";
import RegisterForm from "@/pages/Register/RegisterForm";
// import Reservas from "@/pages/Register/Reservas";

import Countries from "@/pages/Administration/Locations/Countries";
import Cities from "@/pages/Administration/Locations/Cities";
import Parkings from "@/pages/Administration/Parkings/Parkings";
// import Permissions from "@/pages/Administration/Permissions/Permissions";
import NotificationGroupsPage from "@/pages/Administration/NotificationGroups/NotificationGroupsPage";
// import Reports from "@/pages/Reports/ReportsPage.jsx";
import ReportsRouter from "@/pages/Reports/ReportsRouter.jsx";
// import ConfigPage from "@/pages/Configuraciones/ConfigPage.jsx";

import ClientesList from "@/pages/Clientes/ClientesList.jsx";
import ClienteDetail from "@/pages/Clientes/ClienteDetail.jsx";
import SitesList from "@/pages/Clientes/SitesList.jsx";

import BodegasList from "@/pages/Inventario/BodegasList.jsx";
import BodegaDetail from "@/pages/Inventario/BodegaDetail.jsx";
import ActivosList from "@/pages/Inventario/ActivosList.jsx";

// === Help Center (usuario) ===
import HelpHome from "@/pages/HelpPage/HelpHome.jsx";
import HelpFaqsList from "@/pages/HelpPage/HelpFaqsList.jsx";
import HelpFaqDetail from "@/pages/HelpPage/HelpFaqDetail.jsx";
import HelpTutorialsList from "@/pages/HelpPage/HelpTutorialsList.jsx";
import HelpTutorialDetail from "@/pages/HelpPage/HelpTutorialDetail.jsx";
import HelpStatusPage from "@/pages/HelpPage/HelpStatusPage.jsx";
import HelpChangelogList from "@/pages/HelpPage/HelpChangelogList.jsx";
import HelpChangelogDetail from "@/pages/HelpPage/HelpChangelogDetail.jsx";

// === Help Center (admin) ===
import FAQsAdminPage from "@/pages/SoporteAdmin/FAQsAdminPage.jsx";
import TutorialsAdminPage from "@/pages/SoporteAdmin/TutorialsAdminPage.jsx";
import ChangelogsAdminPage from "@/pages/SoporteAdmin/ChangelogsAdminPage.jsx";
import StatusAdminPage from "@/pages/SoporteAdmin/StatusAdminPage.jsx";

import HelpSearchResults from "@/pages/HelpPage/HelpSearchResults.jsx";
import Notificaciones from "@/pages/Notificaciones/Notificaciones.jsx";
import SettingsPage from "@/pages/Settings/SettingsPage";

// Rutas
import RutasList from "@/pages/rutas/RutasList.jsx";
import RutasForm from "@/pages/rutas/RutasForm.jsx";

// Reservas
import ReservasList from "@/pages/reservas/ReservasList.jsx";
import ReservasForm from "@/pages/reservas/ReservasForm.jsx";

// Viaticos
import ViaticosList from "@/pages/viaticos/ViaticosList.jsx";
import ViaticosForm from "@/pages/viaticos/ViaticosForm.jsx";

// liquidaciones
import LiquidacionForm from "@/pages/viaticos/LiquidacionForm.jsx";

// Peajes
import PeajesList from "@/pages/peajes/PeajesList.jsx";
import PeajesForm from "@/pages/peajes/PeajesForm.jsx";
import OperacionesPage from "@/pages/operaciones/OperacionesPage";

// Roles
import RolesList from "@/pages/Administration/Roles/RolesList.jsx";

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="home" element={<Home />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="preview/:kind/:id" element={<EntityPreviewPage />} />
        <Route path="help/search" element={<HelpSearchResults />} />
        <Route path="notificaciones" element={<Notificaciones />} />

        {/* Usuarios / Cuenta */}
        <Route path="usuarios">
          <Route index element={<UsersList />} />
          <Route path="new" element={<UsersForm />} />
          <Route path="edit/:id" element={<UsersForm />} />
        </Route>
        <Route path="mi-cuenta" element={<MyAccount />} />

        {/* Vehículos / Registro */}
        <Route path="vehiculos" element={<Vehiculos />} />
        <Route path="panel-vehiculos" element={<OperacionesPage />} />
        <Route path="panel-vehiculos/register" element={<RegisterForm />} />
        {/* <Route path="reservas" element={<Reservas />} /> */}

        {/* Rutas */}
        <Route path="rutas">
          <Route index element={<RutasList />} />
          <Route path="new" element={<RutasForm />} />
          <Route path="edit/:id" element={<RutasForm />} />
        </Route>

        {/* Reservas */}
        <Route path="reservas-vehiculos">
          <Route index element={<ReservasList />} />
          <Route path="new" element={<ReservasForm />} />
          <Route path="edit/:id" element={<ReservasForm />} />
        </Route>

        {/* Viaticos */}
        <Route path="viaticos">
          <Route index element={<ViaticosList />} />
          <Route path="new" element={<ViaticosForm />} />
          <Route path="edit/:id" element={<ViaticosForm />} />
          <Route path=":id/liquidar" element={<LiquidacionForm />} />
        </Route>

        {/* Peajes */}
        <Route path="peajes">
          <Route index element={<PeajesList />} />
          <Route path="new" element={<PeajesForm />} />
          <Route path="edit/:id" element={<PeajesForm />} />
        </Route>

        {/* Roles */}
        <Route path="roles" element={<RolesList />} />

        {/* Administración */}
        <Route path="countries" element={<Countries />} />
        <Route path="cities" element={<Cities />} />
        <Route path="parkings" element={<Parkings />} />
        {/* <Route path="permissions" element={<Permissions />} /> */}
        <Route
          path="notificacion-grupos"
          element={<NotificationGroupsPage />}
        />
        <Route path="reports" element={<ReportsRouter />} />
        <Route path="configuraciones" element={<SettingsPage />} />

        {/* Clientes */}
        <Route path="clientes" element={<ClientesList />} />
        <Route path="clientes/:id/*" element={<ClienteDetail />} />
        <Route path="sites" element={<SitesList />} />

        {/* Inventario */}
        <Route path="inventario">
          <Route path="bodegas">
            <Route index element={<BodegasList />} />
            <Route path=":id" element={<BodegaDetail />} />
          </Route>
          <Route path="activos" element={<ActivosList />} />
        </Route>

        {/* Help Center (usuario) - anidado */}
        <Route path="help">
          <Route index element={<HelpHome />} />
          <Route path="faqs">
            <Route index element={<HelpFaqsList />} />
            <Route path=":slug" element={<HelpFaqDetail />} />
          </Route>
          <Route path="tutorials">
            <Route index element={<HelpTutorialsList />} />
            <Route path=":slug" element={<HelpTutorialDetail />} />
          </Route>
          <Route path="status" element={<HelpStatusPage />} />
          <Route path="changelog">
            <Route index element={<HelpChangelogList />} />
            <Route path=":slug" element={<HelpChangelogDetail />} />
          </Route>
        </Route>

        {/* Help Center (admin) */}
        {/* Help Center (admin) - anidado en /admin/help */}
        <Route path="support">
          <Route path="faqs" element={<FAQsAdminPage />} />
          <Route path="tutorials" element={<TutorialsAdminPage />} />
          <Route path="changelogs" element={<ChangelogsAdminPage />} />
          <Route path="services" element={<StatusAdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
