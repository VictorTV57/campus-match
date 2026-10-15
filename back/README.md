# CampusMatch — back

API NestJS 11 + Prisma (SQLite). Installation et lancement : voir le
[README principal](../README.md) et le [guide de contribution](../CONTRIBUTING.md).

| Commande (depuis `back/`) | Effet |
|---|---|
| `npm run start:dev` | Serveur avec rechargement → http://localhost:3000 |
| `npm test` | Tests unitaires (Jest) |
| `npm run lint` | ESLint (avec correction automatique) |
| `npm run format` | Prettier |
| `npm run sync` | Copie les universités depuis mya.epitech.eu |
| `npm run prisma:migrate` | Applique / crée les migrations |
| `npm run prisma:studio` | Explorateur de la base |

- Fonctionnement interne (sync, score, classement) : [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Routes : [docs/API.md](../docs/API.md)
- Variables d'environnement : [`.env.example`](.env.example)
