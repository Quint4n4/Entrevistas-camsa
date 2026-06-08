export function ThankYouCard({ name }: { name: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <h1 style={{ fontSize: "clamp(28px, 4.5vw, 42px)" }}>
        ¡Gracias{name ? `, ${name}` : ""}!
      </h1>
      <p className="intro">
        Tus respuestas se guardaron correctamente. En breve nos pondremos en
        contacto contigo de forma privada y discreta.
      </p>
    </div>
  );
}
