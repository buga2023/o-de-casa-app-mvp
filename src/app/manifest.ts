import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ô de Casa!",
    short_name: "Ô de Casa",
    description:
      "Vizinhos de confiança recebem suas encomendas com foto e comprovante rastreável.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF4E8",
    theme_color: "#FAF4E8",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
