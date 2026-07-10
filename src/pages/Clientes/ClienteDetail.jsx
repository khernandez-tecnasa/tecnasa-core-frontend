// src/pages/Clientes/ClienteDetail.jsx
import { useMemo, useState } from "react";
import {
  useParams,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ClienteInfo      from "./ClienteInfo.jsx";
import ClienteSites     from "./ClienteSites.jsx";
import ClienteActivos   from "./ClienteActivos.jsx";
import ClienteContratos from "./ClienteContratos.jsx";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ClienteDetail() {
  const { id } = useParams();
  const location = useLocation();

  const [siteCount, setSiteCount]     = useState(0);
  const [activosCount, setActivosCount] = useState(null);
  const [contratosCount, setContratosCount] = useState(null);

  const tabs = useMemo(
    () => [
      { key: "informacion", label: "Información" },
      { key: "sites",       label: "Sites",   count: siteCount },
      { key: "activos",     label: "Activos", count: activosCount },
      { key: "contratos",   label: "Contratos", count: contratosCount },
    ],
    [siteCount, activosCount, contratosCount]
  );

  const activeTab = useMemo(() => {
    const found = tabs.find(
      (tab) =>
        location.pathname.endsWith(`/${tab.key}`) ||
        location.pathname.includes(`/${tab.key}/`)
    );
    return found?.key ?? "informacion";
  }, [location.pathname, tabs]);

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Botón volver */}
        <div className="mb-4">
          <Link
            to="/admin/clientes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
            Volver al listado
          </Link>
        </div>

        {/* Tabs de navegación */}
        <Tabs value={activeTab} className="w-full">
          <TabsList className="w-full sm:w-auto flex flex-nowrap overflow-x-auto justify-start bg-transparent p-0 gap-1 border-b border-border/60 pb-px mb-6">
            {tabs.map((tab) => {
              const to = `/admin/clientes/${id}/${tab.key}`;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  asChild
                  className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-sm text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground">
                  <Link to={to} className="flex items-center gap-2 no-underline">
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 rounded-full text-[10px] font-bold">
                        {tab.count}
                      </Badge>
                    )}
                  </Link>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Contenido de rutas hijas */}
        <Routes>
          <Route index element={<Navigate to="informacion" replace />} />
          <Route path="informacion" element={<ClienteInfo />} />
          <Route path="sites"  element={<ClienteSites  onCountChange={setSiteCount} />} />
          <Route path="activos" element={<ClienteActivos onCountChange={setActivosCount} />} />
          <Route path="contratos" element={<ClienteContratos onCountChange={setContratosCount} />} />
          <Route path="*" element={<Navigate to="informacion" replace />} />
        </Routes>
      </div>
    </div>
  );
}
