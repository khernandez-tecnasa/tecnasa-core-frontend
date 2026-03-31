import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

// =============================
// 🔐 REGISTRO PASSKEY
// =============================

// 1. Obtener opciones
export async function getRegisterOptions() {
  try {
    const res = await fetchConToken(endpoints.webauthnRegisterOptions, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error getRegisterOptions:", err);
    throw err;
  }
}

// 2. Verificar registro
export async function verifyRegisterPasskey(data) {
  try {
    const res = await fetchConToken(endpoints.webauthnRegisterVerify, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Error verificando passkey");
    }

    return json;
  } catch (err) {
    console.error("Error verifyRegisterPasskey:", err);
    throw err;
  }
}

// =============================
// 🔓 LOGIN PASSKEY
// =============================

// 3. Obtener opciones login
export async function getLoginOptions(username) {
  try {
    const res = await fetchConToken(endpoints.webauthnLoginOptions, {
      method: "POST",
      body: JSON.stringify({ username }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error getLoginOptions:", err);
    throw err;
  }
}

// 4. Verificar login
export async function verifyLoginPasskey(data) {
  try {
    const res = await fetchConToken(endpoints.webauthnLoginVerify, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Error en login con passkey");
    }

    return json;
  } catch (err) {
    console.error("Error verifyLoginPasskey:", err);
    throw err;
  }
}

// =============================
// 📊 STATUS (si tiene passkeys)
// =============================

export async function getPasskeysStatus() {
  try {
    const res = await fetchConToken(endpoints.webauthnStatus);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error getPasskeysStatus:", err);
    throw err;
  }
}

// =============================
// 📱 LISTAR PASSKEYS
// =============================

export async function getPasskeysList() {
  try {
    const res = await fetchConToken(endpoints.webauthnList);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error getPasskeysList:", err);
    throw err;
  }
}

// =============================
// ❌ ELIMINAR PASSKEY
// =============================

// export async function deletePasskey(id) {
//   try {
//     const res = await fetchConToken(`${endpoints.webauthnDelete}/${id}`, {
//       method: "DELETE",
//     });

//     const json = await res.json();

//     if (!res.ok) {
//       throw new Error(json.message || "Error eliminando passkey");
//     }

//     return json;
//   } catch (err) {
//     console.error("Error deletePasskey:", err);
//     throw err;
//   }
// }

export async function deletePasskey(id) {
  const res = await fetchConToken(`${endpoints.webauthnDelete}/${id}`, {
    method: "DELETE",
  });

  let json = null;

  try {
    json = await res.json();
  } catch (e) {
    // evita crash si no viene JSON
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}

export async function updatePasskeyName(id, deviceName) {
  const res = await fetchConToken(`/api/webauthn/passkeys/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ deviceName }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  let json = null;

  try {
    json = await res.json();
  } catch (e) {}

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}
