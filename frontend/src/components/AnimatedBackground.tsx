/** Fondo: tu GIF (si existe public/background.gif) + un velo suave para contraste. */
export function AnimatedBackground() {
  return (
    <>
      <div className="bg-gif" />
      <div className="bg-veil" />
    </>
  );
}
