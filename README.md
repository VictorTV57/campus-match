<h1 align="center">
  <img src="docs/assets/readme-banner.svg" alt="CampusMatch — Swipe your way to the right exchange campus." width="100%" />
</h1>

Choisir son université d'échange de 4ᵉ année (Tek4, Epitech) à partir de ses
propres critères : un **score de compatibilité**, une interface de **swipe**
façon Tinder pour affiner, et au bout un **top 8 ordonné** — les 8 vœux que
l'on soumet à Epitech.

Les données sont réelles : toutes les universités partenaires sont copiées depuis
[mya.epitech.eu](https://mya.epitech.eu) (pays, langue, frais, GPA requis,
spécialisations, double diplôme, photos, textes de présentation…).

## Fonctionnalités

- **Questionnaire** : pays, langues d'enseignement, spécialisations, budget,
  GPA, durée du séjour, double diplôme — plus des notes personnelles qui
  n'entrent pas dans le score.
- **Score de compatibilité** de 0 à 100 %, avec le détail par critère. Un
  critère non renseigné (ou sans donnée côté Epitech) n'est jamais compté
  comme un zéro.
- **Swipe** : like, pass, super like, à la souris, au doigt ou au clavier.
- **Top 8** ajusté par les swipes, avec filtres (pays, langue, budget…) et
  **mode strict** (uniquement ce qui respecte tous les critères).
- **Fiches université** : photos, cours, logement, coût de la vie, démarches,
  lien vers la page officielle mya.
- **Accueil** avec ton Top 1, raccourcis et **export CSV / Excel** : tout le
  catalogue, ou tes swipes classés (lignes colorées vert / or / rouge dans Excel).
- Une page d'**aide** intégrée.
- Interface **français / anglais**.
- **Mode anonyme** pour essayer sans créer de compte (données non
  sauvegardées, effacées à la déconnexion ou après 24 h).

## Démarrage rapide

Prérequis : **Node.js 22.12+** (ou 20.19+) et npm.

```bash
git clone git@github.com:VictorTV57/campus-match.git
cd campus-match
npm install

# Configuration du back : copier le modèle puis remplir les deux secrets JWT
cp back/.env.example back/.env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # à lancer 2 fois

# Base de données + données Epitech
npm run prisma:migrate     # crée back/prisma/dev.db
npm run sync               # copie les universités depuis mya.epitech.eu

# Dans deux terminaux
npm run dev:back           # API NestJS  → http://localhost:3000
npm run dev:front          # Front Vite  → http://localhost:5173
```

Ouvre http://localhost:5173, crée un compte, remplis tes préférences, swipe.

> Le sync se lance aussi tout seul au premier démarrage du back si la table
> des universités est vide. Pour rafraîchir les données plus tard :
> `npm run sync`.

## Scripts utiles (depuis la racine)

| Commande | Effet |
|---|---|
| `npm run dev:front` / `npm run dev:back` | Lance le front / le back en mode développement |
| `npm run build:front` / `npm run build:back` | Build de production |
| `npm run sync` | Recopie les universités depuis l'API mya |
| `npm run prisma:migrate` | Applique les migrations (et en crée une si le schéma a changé) |
| `npm run prisma:studio` | Explorateur de la base → http://localhost:5555 |
| `npm test --workspace back` | Tests unitaires du back (Jest) |
| `npm run lint --workspace back` / `--workspace front` | Lint (ESLint / oxlint) |

## Structure du dépôt

```
campus-match/
├── back/                 API NestJS 11 + Prisma (SQLite)
│   ├── prisma/           schéma et migrations
│   └── src/              un module par domaine : auth, preferences,
│                         universities, swipes, matching, sync
├── front/                React 19 + Vite + TailwindCSS 4
│   └── src/              pages, composants, client API, traductions (i18n/)
├── docs/                 architecture et référence de l'API
└── .github/              modèles d'issues et de pull request
```

## Documentation

- [Contribuer](CONTRIBUTING.md) — installation, conventions, branches, pull requests
- [Architecture](docs/ARCHITECTURE.md) — sync des données, calcul du score, classement
- [API](docs/API.md) — toutes les routes du back
- [Sécurité](SECURITY.md) — signaler une vulnérabilité

## Licence

[MIT](LICENSE) — tu peux réutiliser, modifier et redistribuer le code, en
conservant la mention de copyright.

## Statut

Projet personnel, sans lien officiel avec Epitech. Les données appartiennent à
Epitech et sont lues sur leur API publique ; CampusMatch ne fait que les copier
en local pour les classer.
