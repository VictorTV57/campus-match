# CampusMatch — front

React 19 + Vite + TailwindCSS 4 + React Router. Installation et lancement :
voir le [README principal](../README.md) et le
[guide de contribution](../CONTRIBUTING.md).

| Commande (depuis `front/`) | Effet |
|---|---|
| `npm run dev` | Serveur de développement → http://localhost:5173 |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run lint` | oxlint |

- En développement, `/api/*` est relayé vers le back (`vite.config.ts`) : le
  back doit tourner sur le port 3000.
- Tout texte affiché passe par `t('clé')` ; les traductions FR / EN sont dans
  [`src/i18n/messages.ts`](src/i18n/messages.ts).
- Organisation du code : [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#front-frontsrc).
