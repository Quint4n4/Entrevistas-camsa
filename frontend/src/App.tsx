import { FormApp } from "./FormApp";
import { AdminApp } from "./admin/AdminApp";

/** Router simple: /admin → panel; cualquier otra ruta → formulario. */
export function App() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return <AdminApp />;
  return <FormApp />;
}
