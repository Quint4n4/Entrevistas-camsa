import { useState } from "react";
import { adminApi } from "./api";
import { adminToken } from "../lib/tokenStore";
import { ApiError } from "../lib/http";

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { token } = await adminApi.login(username, password);
      adminToken.set(token);
      onSuccess();
    } catch (e) {
      setErr(e instanceof ApiError ? e.detail : "Error de conexión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card" style={{ width: "min(420px, 94vw)" }} onSubmit={submit}>
        <div className="eyebrow">Panel privado</div>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>Iniciar sesión</h1>
        <p className="intro" style={{ marginBottom: 18 }}>
          Acceso solo para el equipo.
        </p>

        <div className="field">
          <label>Usuario</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && (
          <p style={{ color: "#9a3b3b", fontSize: 14, margin: "4px 0 0" }}>{err}</p>
        )}

        <div className="btn-row" style={{ justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !username || !password}
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
