# Design — tokens visuais

## Paleta (baiana, acolhedora)
| Token | Hex | Uso |
|---|---|---|
| creme | #FAF4E8 | fundo |
| tinta | #1A1410 | texto |
| terracota | #C84B2F | primária (CTAs, marca, "!") |
| dourado | #D9A441 | acento (badges, destaques) |
| verde | #2D5A3D | sucesso/secundária |
| linha | rgba(26,20,16,.12) | bordas/divisores |

## Tipografia
- Títulos: serifa elegante — **Fraunces** ou **Playfair Display**.
- Corpo/UI: **Inter**.

## Layout
- Mobile-first: container central `max-width: 430px`, padding 16px.
- **Bottom tab bar** fixa: Início · Vizinhos · Registrar (botão central destacado) · Notificações · Perfil.
- Cards com cantos arredondados (12–16px), sombras suaves, bastante respiro.
- Estados sempre tratados: loading (skeleton), vazio (ilustração + CTA), erro (toast amigável).

## Componentes (shadcn/ui)
Button, Card, Input, Form, Dialog, Sheet, Badge, Avatar, Tabs, Toast, Skeleton.
Marca textual: "Ô de Casa" + "!" em terracota.
