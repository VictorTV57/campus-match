# Contribuer à CampusMatch

Merci de ton intérêt ! Ce guide explique comment installer le projet, où se
trouve quoi, et comment proposer une modification.

## Sommaire

1. [Signaler un bug ou proposer une idée](#1-signaler-un-bug-ou-proposer-une-idée)
2. [Installer le projet](#2-installer-le-projet)
3. [Workflow : branche → commit → pull request](#3-workflow--branche--commit--pull-request)
4. [Conventions de code](#4-conventions-de-code)
5. [Vérifications avant d'ouvrir une PR](#5-vérifications-avant-douvrir-une-pr)
6. [Cas particuliers](#6-cas-particuliers)

## 1. Signaler un bug ou proposer une idée

Tout passe par les [issues GitHub](https://github.com/VictorTV57/campus-match/issues/new/choose),
avec deux formulaires :

- **🐛 Bug** : ce qui ne marche pas, comment le reproduire, ce que tu attendais.
- **💡 Idée / amélioration** : le besoin d'abord, la solution ensuite.

Avant d'en ouvrir une, cherche si elle n'existe pas déjà. Pour une **faille de
sécurité**, n'ouvre pas d'issue publique : voir [SECURITY.md](SECURITY.md).

Pour une modification non triviale, **ouvre une issue avant de coder** : on se
met d'accord sur l'approche, et ta PR a plus de chances d'être acceptée telle
quelle. Les corrections de typo ou de doc peuvent aller directement en PR.

## 2. Installer le projet

Prérequis : **Node.js 22.12+** (ou 20.19+) et npm. Le dépôt est un monorepo
npm (workspaces `front` et `back`) : un seul `npm install` à la racine suffit.

```bash
# 1. Fork du dépôt sur GitHub, puis :
git clone git@github.com:<ton-pseudo>/campus-match.git
cd campus-match
git remote add upstream git@github.com:VictorTV57/campus-match.git
npm install

# 2. Variables d'environnement du back
cp back/.env.example back/.env
#    remplir JWT_ACCESS_SECRET et JWT_REFRESH_SECRET avec deux valeurs DIFFÉRENTES :
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Base de données locale + données Epitech
npm run prisma:migrate
npm run sync

# 4. Lancer (deux terminaux)
npm run dev:back     # http://localhost:3000
npm run dev:front    # http://localhost:5173 (relaie /api vers le back)
```

| Variable (`back/.env`) | Rôle |
|---|---|
| `DATABASE_URL` | Fichier SQLite, relatif à `back/prisma/` (défaut : `file:./dev.db`) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Secrets de signature, **différents** l'un de l'autre (le back refuse de démarrer sinon) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | Durées de vie des tokens (défaut : `15m`, `7d`) |
| `PORT` | Port du back (défaut `3000` ; le proxy Vite pointe dessus) |

`back/.env` et la base `*.db` sont ignorés par git : ne les commite jamais.

**Problèmes fréquents**

- *Page blanche ou « Le serveur ne répond pas »* : le back n'est pas lancé.
- *`EPERM … query_engine-windows.dll.node` pendant `prisma generate`* (Windows) :
  le back tourne et verrouille le moteur Prisma. Arrête-le, relance la commande.
- *Le top 8 est vide* : la table des universités est vide → `npm run sync`.

## 3. Workflow : branche → commit → pull request

### Branches

`main` est toujours fonctionnelle. On n'y pousse jamais directement : chaque
modification passe par une branche et une pull request.

```bash
git fetch upstream
git switch -c feat/filtre-erasmus upstream/main
```

| Préfixe | Pour |
|---|---|
| `feat/` | une fonctionnalité |
| `fix/` | une correction de bug |
| `docs/` | de la documentation uniquement |
| `refactor/` | une restructuration sans changement de comportement |
| `chore/` | dépendances, outillage, configuration |

### Commits

Format [Conventional Commits](https://www.conventionalcommits.org/fr/), en
français ou en anglais, au présent :

```
feat(matching): ajoute le filtre Erasmus+ au top 8
fix(sync): ignore les images nulles renvoyées par mya
docs: précise l'installation sous Windows
```

Le scope (entre parenthèses) est le module concerné : `auth`, `preferences`,
`universities`, `swipes`, `matching`, `sync`, `front`, `i18n`…
Préfère plusieurs petits commits cohérents à un gros commit fourre-tout.

### Pull request

1. Mets ta branche à jour : `git fetch upstream && git rebase upstream/main`.
2. Lance les [vérifications](#5-vérifications-avant-douvrir-une-pr).
3. Pousse sur ton fork et ouvre la PR vers `main`. Le modèle de PR s'affiche
   automatiquement : remplis-le, coche la checklist, lie l'issue (`Closes #12`).
4. Une PR = un sujet. Si tu corriges autre chose en passant, ouvre une autre PR.
5. Pour une modification visible, ajoute une capture d'écran (avant / après).

La PR est relue, éventuellement commentée ; pousse tes corrections sur la même
branche. Une fois approuvée, elle est fusionnée en **squash merge** : le titre
de la PR devient le message du commit sur `main`, d'où l'intérêt de lui donner
le format Conventional Commits.

## 4. Conventions de code

Les règles du projet :

- **TypeScript strict** partout, `camelCase` pour variables et fonctions,
  `PascalCase` pour composants et classes.
- **Back** : un module NestJS par domaine. Toute entrée d'API est validée par
  un DTO `class-validator` — ne jamais faire confiance au client. Messages de
  validation en français.
- **Front** : pas de texte en dur dans les composants. Chaque libellé passe
  par `t('clé')`, avec sa traduction **française et anglaise** dans
  `front/src/i18n/messages.ts` (le build échoue si une langue manque).
- **Données** : l'app ne lit jamais l'API mya en direct, uniquement SQLite
  (voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
- **Préférences** : bien distinguer *critère de score* et *note personnelle*.
  Un nouveau champ doit être rangé explicitement dans l'un des deux.
- Formatage : Prettier pour le back (`npm run format --workspace back`),
  style du fichier existant pour le front (sans point-virgule).
- Ne pas sur-ingénierer : c'est un outil personnel, la solution simple gagne.

**Hors périmètre pour l'instant** (en discuter dans une issue avant) : mise en
relation entre étudiants, PostgreSQL, Docker, CI/CD.

## 5. Vérifications avant d'ouvrir une PR

Il n'y a pas encore d'intégration continue : ces commandes sont à lancer en
local, et doivent toutes passer.

```bash
# Back
npm run lint --workspace back                         # corrige aussi ce qui peut l'être (--fix)
npm exec --workspace back -- tsc --noEmit -p tsconfig.json
npm test --workspace back

# Front
npm run lint --workspace front
npm run build --workspace front     # inclut la vérification TypeScript
```

**Tests** : pas besoin de tout tester, mais toute modification du calcul de
score, du classement ou des filtres (`back/src/matching/`) doit être couverte
par un test — c'est la logique la plus sensible aux régressions. Même chose
pour la conversion des données mya (`back/src/sync/mya.mapper.ts`).

## 6. Cas particuliers

### Modifier le schéma de base de données

Ne réécris jamais `back/prisma/schema.prisma` de zéro : modifie-le, puis crée
une migration nommée :

```bash
# --workspace back est nécessaire : depuis le script racine, --name n'arriverait pas jusqu'à Prisma
npm run prisma:migrate --workspace back -- --name ajoute_champ_xyz
```

Sous Windows, arrête le back avant : il verrouille le moteur Prisma.

Commite le schéma **et** le dossier de migration généré. Si la migration
transforme des données existantes (renommage, changement d'unité…), vérifie le
SQL généré et complète-le à la main.

### Ajouter un critère de score

1. Champ dans `Preferences` (schéma + migration), DTO et types.
2. Fonction de note dans `back/src/matching/scoring.ts`, poids dans
   `CRITERION_WEIGHTS`, et règle du mode strict si besoin.
3. Tests dans `scoring.spec.ts`, cas « non renseigné » compris.
4. Champ dans le questionnaire, libellé du détail du score, traductions FR/EN.
5. Mise à jour du tableau des critères dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### La forme de l'API mya a changé

Le sync échoue volontairement **sans rien écrire** (message « Réponse mya
inattendue »). Adapte `mya.types.ts` et `mya.validation.ts` à la nouvelle
forme, puis `mya.mapper.ts`, avec un test.
