# Architecture

Vue d'ensemble du fonctionnement de CampusMatch, pour savoir où intervenir.

```
 mya.epitech.eu ──(npm run sync / POST /sync)──▶ module sync ──▶ SQLite (Prisma)
                                                                    │
 navigateur ──▶ front React (Vite :5173) ──/api──▶ back NestJS (:3000)
                                                   auth · preferences · universities
                                                   swipes · matching (score, top 8)
```

- **Front** : React 19, React Router, TailwindCSS 4. En développement, Vite
  relaie `/api/*` vers le back (même origine pour le navigateur, pas de CORS).
- **Back** : NestJS 11, un module par domaine, Prisma sur SQLite.
- **Données** : le back ne lit **jamais** l'API mya en direct ; il travaille
  sur une copie locale mise à jour par le module `sync`.

## Modules du back (`back/src/`)

| Module | Rôle |
|---|---|
| `auth` | Inscription, connexion, connexion anonyme (compte invité supprimé sous 24 h), JWT (access 15 min + refresh 7 j), `JwtAuthGuard` |
| `preferences` | Questionnaire : critères de score et notes personnelles |
| `universities` | Fiches et valeurs disponibles pour les filtres (pays, langues, spécialisations) |
| `swipes` | Like / pass / super like, un swipe par utilisateur et université |
| `matching` | Calcul du score, classement du top 8, filtres, paquet de swipe |
| `sync` | Copie de l'API mya dans SQLite |
| `export` | Tableur CSV / Excel des universités, depuis la base locale |
| `prisma`, `config` | Accès base, validation des variables d'environnement au démarrage |

## Synchronisation des données (`sync`)

Source : l'API publique non documentée de mya.epitech.eu
(`GET /api/universities` puis `GET /api/universities/:id` pour chaque fiche).

1. **Récupération** (`mya.client.ts`) : `fetch` natif, timeout 10 s, 2 nouvelles
   tentatives, 6 fiches en parallèle au maximum.
2. **Validation** (`mya.validation.ts`) : chaque champ de chaque fiche est
   vérifié (présence, type, valeurs permises). **Une seule fiche invalide et
   le sync s'arrête sans rien écrire** — une API qui change de forme ne peut
   pas corrompre la base.
3. **Conversion** (`mya.mapper.ts`) : HTML → texte enrichi minimal (liens,
   gras, images, filtrés contre les schémas dangereux), `gpa: 0` → `null`
   (pas d'exigence), `"YES"/"NO"` → booléens, noms de fichiers → URLs.
4. **Écriture** (`sync.service.ts`), dans une seule transaction : upsert par
   `myaId`, puis `active = false` pour les universités disparues de l'API. On
   ne supprime pas : les swipes qui les concernent sont conservés.

Le sync se lance au premier démarrage si la table est vide, via
`npm run sync`, ou `POST /sync`.

## Calcul du score (`matching/scoring.ts`)

Chaque critère reçoit une note entre 0 et 1, puis le score est la **moyenne
pondérée** des critères évalués.

| Critère | Préférence ↔ donnée université | Note | Poids |
|---|---|---|---|
| Pays | `countries` ↔ `country` | 1 si choisi, 0 sinon | 5 |
| Langue | `languages` ↔ `language` | 1 si choisie, 0 sinon | 3 |
| Double diplôme | `wantsDoubleDiploma` ↔ `doubleDiploma` | 1 si proposé, 0 sinon | 3 |
| Spécialisation | `studyFields` ↔ `specializations` | part des spécialisations choisies proposées | 2 |
| Erasmus+ | `erasmusPref` (`yes` / `no` / `any`) ↔ `erasmus` | 1 si conforme au choix, 0 sinon | 2 |
| Places | `minSpots` ↔ `spots` | 1 si au moins ce nombre de places, 0 sinon | 2 |
| Budget | `budgetMax` ↔ `extraChargeEur` | 1 jusqu'au budget, puis linéaire jusqu'à 0 à 2× le budget | 2 |
| GPA | `userGpa` ↔ `gpaMin` | 1 si suffisant, 0 sinon | 1 |
| Durée | `semesterPref` ↔ `semester` | 1 si compatible, 0 sinon | 1 |

**Règle centrale : un critère sans préférence ou sans donnée est exclu de la
moyenne, jamais compté comme 0.** Une université n'est pas pénalisée parce
qu'Epitech n'indique pas ses spécialisations, ni parce que l'élève n'a pas
renseigné son GPA. Le détail renvoyé par l'API (`breakdown`) indique pour
chaque critère sa note et son poids, ou la raison de son exclusion
(`no-preference`, `no-data`).

**Mode strict** (`passesStrict`) : seules les universités qui respectent
entièrement chaque critère renseigné sont classées — note de 1 partout, sauf
la spécialisation où une seule correspondance suffit.

Les **notes personnelles** du questionnaire (nourriture, vie sociale, climat,
logement) ne servent jamais au score : Epitech ne fournit pas ces données.

## Classement du top 8 (`matching/ranking.ts`, `matching.service.ts`)

1. Universités actives, scorées (et réduites aux correspondances strictes en
   mode strict).
2. **Filtres** éventuels de la page (`matching/filters.ts`) : contrairement au
   score, ils excluent.
3. **Ajustement par les swipes** : pass → retirée du classement,
   like → +0,10, super like → +0,25 sur la clé de tri. Le score de
   compatibilité affiché, lui, ne change pas.
4. Tri décroissant, départage par nom, coupe à 8.

Le **paquet de swipe** (`GET /ranking/deck`) propose les universités pas
encore swipées, les plus compatibles d'abord.

## Front (`front/src/`)

| Dossier | Contenu |
|---|---|
| `api/` | Client HTTP (ajoute l'access token, le renouvelle sur un 401), types miroir du back |
| `auth/` | Contexte de session, routes protégées |
| `pages/` | Une page par écran : accueil, connexion, préférences, top 8, swipe, fiche, aide |
| `components/` | Briques réutilisables (cartes, filtres, carrousel, drapeaux…) |
| `i18n/` | Traductions FR / EN (`messages.ts`) et fournisseur de langue |

La session garde l'access token en mémoire et le refresh token dans le
`localStorage`. Les filtres du top 8 vivent dans l'URL.

## Base de données (`back/prisma/schema.prisma`)

| Table | Contenu |
|---|---|
| `User` | Compte (mot de passe haché en argon2) |
| `Preferences` | Un jeu par utilisateur ; listes stockées en JSON (SQLite n'a pas de tableaux) |
| `University` | Copie des fiches mya, identifiées par `myaId` |
| `Swipe` | Un swipe par couple utilisateur / université |
| `SocialMatch` | Réservé à la v2 (mise en relation entre étudiants), non utilisé |

Toutes les clés étrangères sont en `onDelete: Cascade` : supprimer un compte
supprime ses préférences et ses swipes.
