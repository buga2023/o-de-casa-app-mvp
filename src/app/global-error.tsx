"use client";

// Boundary de último recurso — substitui o layout raiz inteiro, então
// não pode depender de estilos/fonts do app.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF4E8",
          color: "#2B2118",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            Algo deu errado
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "16px" }}>
            O Ô de Casa! encontrou um erro inesperado.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#C4633F",
              color: "#FAF4E8",
              border: 0,
              borderRadius: "12px",
              padding: "12px 20px",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
