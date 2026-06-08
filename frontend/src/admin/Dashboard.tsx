import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "./api";
import { ApiError } from "../lib/http";
import { PriorityPie } from "./PriorityPie";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function Dashboard({
  onOpen,
  onEdit,
  onLogout,
}: {
  onOpen: (token: string) => void;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const [filter, setFilter] = useState<"" | "completed" | "in_progress">("");

  const dash = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminApi.dashboard,
  });
  const subs = useQuery({
    queryKey: ["admin", "subs", filter],
    queryFn: () => adminApi.submissions(filter),
  });

  // Si el token expiró/inválido (401), volver al login.
  useEffect(() => {
    const e = dash.error ?? subs.error;
    if (e instanceof ApiError && e.status === 401) onLogout();
  }, [dash.error, subs.error, onLogout]);

  const stats = dash.data;

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="brand">
          <small>Panel de administrador</small>
          Entrevista Premium
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="chip active" onClick={onEdit}>
            ✎ Editar formulario
          </button>
          <button className="chip" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Métricas */}
        <div className="metric-grid">
          <div className="metric">
            <div className="label">Total</div>
            <div className="num">{stats?.total ?? "—"}</div>
          </div>
          <div className="metric">
            <div className="label">Completas</div>
            <div className="num">{stats?.completed ?? "—"}</div>
          </div>
          <div className="metric">
            <div className="label">A medias</div>
            <div className="num">{stats?.in_progress ?? "—"}</div>
          </div>
          <div className="metric gold">
            <div className="label">% Finalización</div>
            <div className="num">
              {stats ? `${stats.completion_rate}%` : "—"}
            </div>
          </div>
        </div>

        {/* Distribución por prioridad */}
        <div className="section-title">Prioridad principal</div>
        <div className="bars">
          {stats && stats.total > 0 ? (
            <PriorityPie data={stats.by_priority} total={stats.total} />
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>Aún no hay datos.</span>
          )}
        </div>

        {/* Tabla de entrevistas */}
        <div className="section-title">Entrevistas</div>
        <div className="filter-row">
          {[
            { v: "" as const, label: "Todas" },
            { v: "completed" as const, label: "Completas" },
            { v: "in_progress" as const, label: "A medias" },
          ].map((f) => (
            <button
              key={f.v}
              className={`chip${filter === f.v ? " active" : ""}`}
              onClick={() => setFilter(f.v)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <table className="subs">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Avance</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subs.isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Cargando…
                </td>
              </tr>
            ) : subs.data && subs.data.length > 0 ? (
              subs.data.map((s) => (
                <tr key={s.token}>
                  <td>{s.nombre || <em style={{ color: "#aaa" }}>Sin nombre</em>}</td>
                  <td>{s.email || "—"}</td>
                  <td>{s.priority_display || "—"}</td>
                  <td>
                    <span
                      className={`badge ${s.status === "completed" ? "done" : "prog"}`}
                    >
                      {s.status_display}
                    </span>
                  </td>
                  <td>{s.progress}%</td>
                  <td>{formatDate(s.started_at)}</td>
                  <td>
                    <button className="link-btn" onClick={() => onOpen(s.token)}>
                      Ver →
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Sin entrevistas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
