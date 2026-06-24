/** Logo de la clínica (identidad de marca) para mostrar en las cards. */
export function Logo({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <img
      src="/logo.png"
      alt="Clínica CAMSA"
      className={`brand-logo brand-logo-${size}`}
    />
  );
}
