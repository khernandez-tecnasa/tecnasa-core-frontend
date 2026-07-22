import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSites,
  createSite,
  updateSite,
  getSitesByCliente,
} from "../../services/SitesServices";
import { getClientes } from "../../services/ClientesServices";
import { getCities } from "../../services/LocationServices";
import {
  Box,
  Card,
  Typography,
  Stack,
  Button,
  Table,
  Sheet,
  Input,
  Chip,
  Modal,
  ModalDialog,
  FormControl,
  FormLabel,
  Select,
  Option,
  Divider,
  IconButton,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useToast } from "../../context/ToastContext";

export default function SitesList() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    id_cliente: "",
    nombre: "",
    descripcion: "",
    id_ciudad: "",
  });

  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    try {
      const [sitesData, clientesData, ciudadesData] = await Promise.all([
        getSites(),
        getClientes(),
        getCities(),
      ]);
      setRows(sitesData);
      setClientes(clientesData);
      setCiudades(ciudadesData);
      setError(null);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? t("clients.sites.errors.no_connection")
          : t("clients.sites.errors.load_error")
      );
    } finally {
      setLoading(false);
    }
  }

  function newSite() {
    setEditing(null);
    setForm({ id_cliente: "", nombre: "", descripcion: "", id_ciudad: "" });
    setOpen(true);
  }

  async function editSite(row) {
    try {
      const full = await getSitesByCliente(row.id);
      setEditing(full);
      setForm({
        id_cliente: full.id_cliente || "",
        nombre: full.nombre,
        descripcion: full.descripcion || "",
        id_ciudad: full.id_ciudad || "",
      });
      setOpen(true);
    } catch (err) {
      showToast(t("clients.sites.errors.load_failed"), "danger");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.id_cliente) return showToast(t("clients.sites.form.select_client"), "warning");
    if (!form.nombre.trim())
      return showToast(t("clients.sites.errors.name_required"), "warning");

    setSaving(true);
    try {
      if (editing) {
        await updateSite(editing.id, form);
      } else {
        await createSite(form);
      }
      showToast(t("clients.sites.success.saved"), "success");
      setOpen(false);
      load();
    } catch (err) {
      showToast(err.message || t("clients.sites.errors.save_failed"), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box p={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        spacing={1}>
        <Typography level="h4">{t("clients.tabs.sites")}</Typography>
        <Button startDecorator={<AddIcon />} onClick={newSite}>
          {t("clients.sites.actions.new_short")}
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ overflowX: "auto" }}>
        {loading ? (
          <Sheet p={2}>{t("common.loading")}</Sheet>
        ) : error ? (
          <Card
            variant="soft"
            color="danger"
            sx={{ p: 3, textAlign: "center" }}>
            <Typography level="title-md">{error}</Typography>
            <Button sx={{ mt: 2 }} onClick={load}>
              {t("common.retry")}
            </Button>
          </Card>
        ) : rows.length === 0 ? (
          <Sheet p={2} variant="soft">
            {t("clients.sites.empty.title")}
          </Sheet>
        ) : (
          <Table size="sm" stickyHeader>
            <thead>
              <tr>
                <th>{t("clients.columns.client")}</th>
                <th>{t("clients.sites.columns.name")}</th>
                <th>{t("clients.sites.columns.description")}</th>
                <th>{t("clients.sites.columns.city")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.cliente || "—"}</td>
                  <td>{r.nombre}</td>
                  <td>{r.descripcion || "—"}</td>
                  <td>{r.ciudad || "—"}</td>
                  <td>
                    <IconButton onClick={() => editSite(r)}>
                      <EditIcon />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog
          component="form"
          onSubmit={onSubmit}
          sx={{ width: { xs: "100%", sm: 520 } }}>
          <Typography level="title-lg">
            {editing ? t("clients.sites.edit_title") : t("clients.sites.create_title")}
          </Typography>
          <Divider />
          <Stack spacing={1.5} mt={1}>
            <FormControl required>
              <FormLabel>{t("clients.columns.client")}</FormLabel>
              <Select
                disabled={saving}
                value={form.id_cliente}
                onChange={(_, v) => setForm({ ...form, id_cliente: v })}>
                {clientes.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.nombre}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <FormControl required>
              <FormLabel>{t("clients.sites.columns.name")}</FormLabel>
              <Input
                disabled={saving}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t("clients.sites.columns.description")}</FormLabel>
              <Input
                disabled={saving}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t("clients.sites.columns.city")}</FormLabel>
              <Select
                disabled={saving}
                value={form.id_ciudad ? String(form.id_ciudad) : ""}
                onChange={(_, v) => setForm({ ...form, id_ciudad: v })}>
                {ciudades.map((c) => (
                  <Option key={c.id} value={String(c.id)}>
                    {c.ciudad}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
            <Button
              variant="plain"
              onClick={() => setOpen(false)}
              disabled={saving}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              {t("common.actions.save")}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
