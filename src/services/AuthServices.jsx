import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";
const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export async function login(username, password, code = null) {
  try {
    const payload = { username, password };
    if (code) {
      payload.code = code;
    }
    const res = await fetch(endpoints.login, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.error || data?.message || "Login failed");

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

export async function me() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || "No autenticado");
    }
    return res.json();
  } catch (err) {
    console.error("me error:", err);
    throw err;
  }
}

export async function logout() {
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || "Error al cerrar sesión");
    }
    return res.json();
  } catch (err) {
    console.error("logout error:", err);
    throw err;
  }
}

export async function createUserService(newUser) {
  try {
    const res = await fetchConToken(endpoints.registerUsers, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newUser.nombre,
        email: newUser.email,
        username: newUser.username,
        password: newUser.password,
        rol: newUser.rol,
        estatus: newUser.estatus,
        puesto: newUser.puesto,
        id_ciudad: newUser.id_ciudad,
        supervisor_id: newUser.supervisor_id,
      }),
    });

    const data = await res.json();
    return res.ok ? data : null; // Devuelve el usuario creado si la respuesta es OK
  } catch (err) {
    console.error("Create user error:", err);
    return null;
  }
}

export async function getUsers() {
  try {
    const res = await fetchConToken(endpoints.getUsers);
    const data = await res.json();
    return res.ok ? data : [];
  } catch (err) {
    console.error("Get users error:", err);
    return [];
  }
}

export async function getEmailSupervisor(idEmpleado) {
  try {
    const res = await fetchConToken(
      `${endpoints.getEmailSupervisor}?id_empleado=${idEmpleado}`,
    );
    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Get email supervisor error:", err);
    return null;
  }
}

export async function getUserSupervisors() {
  try {
    const res = await fetchConToken(`${endpoints.getEmpleados}/supervisor`);
    const data = await res.json();
    return res.ok ? data : [];
  } catch (err) {
    console.error("Get users suprevisors error:", err);
    return [];
  }
}

export async function updateUser(user) {
  try {
    const res = await fetchConToken(endpoints.updateUser + user.id_usuario, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Update user error:", err);
    return null;
  }
}

export async function getUsersById(id) {
  try {
    const res = await fetchConToken(endpoints.getUsersById + id);
    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Get users by id error:", err);
    return [];
  }
}

export async function updateMyAccount(user) {
  try {
    const res = await fetchConToken(
      endpoints.updateMyAccount + user.id_usuario,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      },
    );

    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Update user error:", err);
    return null;
  }
}

export async function getEmpleados() {
  try {
    const res = await fetchConToken(endpoints.getEmpleados);
    const data = await res.json();
    return res.ok ? data : [];
  } catch (err) {
    console.error("Get users error:", err);
    return [];
  }
}

export async function getEmpleadosById(id) {
  try {
    const res = await fetchConToken(endpoints.getEmpleados + id);
    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Get users by id error:", err);
    return [];
  }
}

export async function deleteUser(id) {
  try {
    const res = await fetchConToken(endpoints.deleteUser + id, {
      method: "DELETE",
    });

    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Delete user error:", err);
    return null;
  }
}

export async function restoreUser(id) {
  try {
    const res = await fetchConToken(endpoints.restoreUser + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: "Activo" }),
    });

    const data = await res.json();
    return res.ok ? data : null;
  } catch (err) {
    console.error("Restore user error:", err);
    return null;
  }
}

export async function forgotPassword(email) {
  try {
    const res = await fetch(endpoints.forgotPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.message || "Error al solicitar recuperación de contraseña",
      );
    }

    return data;
  } catch (err) {
    console.error("forgotPassword error:", err);
    throw err;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const res = await fetch(endpoints.resetPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "No se pudo restablecer la contraseña");
    }

    return data;
  } catch (err) {
    console.error("resetPassword error:", err);
    throw err;
  }
}
