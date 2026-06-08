/** Único lugar que toca el almacenamiento del token del admin. */
const KEY = "entrevista.admin.token";

export const adminToken = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};
