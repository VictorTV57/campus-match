## Quoi et pourquoi

<!-- Ce que change cette PR, et le besoin auquel elle répond. -->

Closes #

## Type de changement

- [ ] 🐛 Correction de bug
- [ ] ✨ Nouvelle fonctionnalité
- [ ] ♻️ Refactor (sans changement de comportement)
- [ ] 📖 Documentation
- [ ] 🔧 Outillage / dépendances

## Comment tester

<!-- Étapes pour vérifier le changement à la main. -->

1.

## Captures d'écran

<!-- Pour tout changement visible : avant / après. Sinon, supprimer cette section. -->

## Checklist

- [ ] La branche est à jour avec `main`
- [ ] `npm run lint --workspace back` et `npm run lint --workspace front` passent
- [ ] `npm test --workspace back` passe ; le score, le classement ou les filtres modifiés sont couverts par un test
- [ ] `npm run build --workspace front` passe
- [ ] Nouvelle entrée d'API validée par un DTO `class-validator`
- [ ] Nouveaux textes d'interface traduits en **français et en anglais** (`front/src/i18n/messages.ts`)
- [ ] Schéma Prisma modifié → migration nommée commitée (sinon : sans objet)
- [ ] Documentation à jour si besoin (README, `docs/`, CONTRIBUTING.md)
- [ ] Aucun secret, `.env` ni fichier `*.db` dans les commits
