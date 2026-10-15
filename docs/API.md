# API du back

Base : `http://localhost:3000` (depuis le front : `/api/...`, relayé par Vite).

- Corps et réponses en JSON.
- 🔒 = route protégée : en-tête `Authorization: Bearer <accessToken>`.
- Toutes les entrées sont validées ; une erreur renvoie `400` avec la liste
  des problèmes dans `message` (un champ inconnu est aussi refusé).

## Authentification

| Route | Corps | Réponse |
|---|---|---|
| `POST /auth/register` | `email`, `password` (8 car. min), `firstName`, `lastName` | `201` + `user`, `accessToken`, `refreshToken` |
| `POST /auth/login` | `email`, `password` | `200` + `user`, `accessToken`, `refreshToken` |
| `POST /auth/refresh` | `refreshToken` | `200` + `accessToken` |
| 🔒 `GET /auth/me` | — | `200` + `user` |
| `POST /auth/guest` | — | `201` + `user` (`isGuest: true`), `accessToken`, `refreshToken` (24 h) |
| 🔒 `DELETE /auth/guest` | — | `204` : supprime le compte invité et ses données ; `403` pour un vrai compte |

**Connexion anonyme** : `POST /auth/guest` crée un compte invité sans
identifiants utilisables (impossible de s'y reconnecter avec `/auth/login`).
Il est supprimé, avec ses préférences et ses swipes, à la déconnexion
(`DELETE /auth/guest`) et au plus tard 24 h après sa création (purge au
démarrage du back et à chaque nouvel invité). Le front garde son refresh
token dans le `sessionStorage` : fermer l'onglet termine la session.

L'access token vit 15 minutes, le refresh token 7 jours (configurable). Les
deux sont signés avec des secrets différents : l'un n'est jamais accepté à la
place de l'autre. Voir [SECURITY.md](../SECURITY.md) pour les limites connues.

## Préférences 🔒

| Route | Réponse |
|---|---|
| `GET /preferences` | `200` + préférences, ou `404` si l'utilisateur n'en a pas encore |
| `PUT /preferences` | `200` + préférences enregistrées |

`PUT` crée ou **remplace entièrement** les préférences : un champ optionnel
absent est remis à `null` (ou à sa valeur par défaut).

```jsonc
{
  "scoring": {                                   // critères du score
    "countries": ["Japan", "Canada"],            // requis, non vide
    "languages": ["English"],                    // requis, non vide
    "studyFields": ["Security", "Networks"],     // optionnel, sans doublon
    "budgetMax": 3000,                           // optionnel, euros, entier >= 0
    "userGpa": 3.2,                              // optionnel, 0 à 4, 2 décimales max
    "semesterPref": "full-year",                 // optionnel : full-year | semester | any
    "wantsDoubleDiploma": true,                  // optionnel, défaut false
    "erasmusPref": "yes",                        // optionnel : yes | no | any
    "minSpots": 3,                               // optionnel, entier >= 1 (partir à plusieurs)
    "strictMode": false                          // optionnel, défaut false
  },
  "notes": {                                     // jamais utilisées dans le score ; tout optionnel
    "foodPref": "végétarien",
    "socialPref": "grande ville",
    "climatePref": "pas trop froid",
    "housingType": "résidence"
  }
}
```

## Universités 🔒

| Route | Réponse |
|---|---|
| `GET /universities/filters` | Valeurs présentes parmi les universités actives : `{ countries, languages, specializations }` |
| `GET /universities/:id` | Fiche complète : infos, `images`, sections `overview`, `courses`, `accommodation`, `cost`, `administrative` (texte enrichi), `myaId` |

## Classement 🔒

### `GET /ranking/top8`

Les 8 universités les mieux classées pour l'utilisateur (`404` sans
préférences). Paramètres optionnels — des filtres qui excluent, appliqués
avant la coupe à 8 :

| Paramètre | Exemple | Effet |
|---|---|---|
| `countries` | `Japan,Canada` | pays parmi la liste |
| `languages` | `English` | langue d'enseignement parmi la liste |
| `specializations` | `Security,Robotics` | au moins une en commun |
| `maxCharge` | `3000` | frais supplémentaires ≤ (euros) |
| `gpa` | `3.2` | exclut les universités qui exigent un GPA plus élevé |
| `semester` | `semester` | `full-year` ou `semester` : formule de séjour compatible |
| `doubleDiploma` | `true` | uniquement avec double diplôme |
| `erasmus` | `true` / `false` | uniquement Erasmus+ / uniquement hors Erasmus+ |
| `minSpots` | `3` | au moins ce nombre de places (pour partir à plusieurs) |

Chaque élément :

```jsonc
{
  "rank": 1,
  "score": 0.92,               // compatibilité 0..1 (null si aucun critère évaluable)
  "rankScore": 1.17,           // clé de tri : score + bonus de swipe
  "swipe": "superlike",        // like | pass | superlike | null
  "strictMatch": true,         // respecte tous les critères renseignés
  "breakdown": {               // détail par critère
    "budget": { "included": true, "score": 0.6, "weight": 2 },
    "gpa": { "included": false, "reason": "no-data" }
    // country, language, specialization, semester, doubleDiploma…
  },
  "university": { "id": "…", "myaId": 121, "name": "…", "country": "Poland", "…": "…" }
}
```

### `GET /ranking/deck?limit=10`

Prochaines cartes à swiper (universités pas encore swipées, les plus
compatibles d'abord), `limit` entre 1 et 50 : `{ cards, remaining }`.

## Swipes 🔒

| Route | Corps | Réponse |
|---|---|---|
| `GET /swipes` | — | Liste des swipes de l'utilisateur |
| `PUT /swipes/:universityId` | `{ "action": "like" \| "pass" \| "superlike" }` | Swipe créé ou remplacé |
| `DELETE /swipes/:universityId` | — | `204`, l'université revient dans le paquet |
| `DELETE /swipes` | — | `{ deleted }` : remise à zéro |

## Export 🔒

`GET /export/universities?kind=catalog|swipes&format=csv|xlsx&lang=fr|en`

Tableur lu depuis la base locale (jamais l'API mya en direct).

| `kind` | Contenu |
|---|---|
| `catalog` | Toutes les universités actives, par nom, **sans aucune donnée personnelle** : nom, ID mya, pays, langue, spécialisations, frais, GPA minimum, durée, double diplôme, Erasmus+, places, lien mya, date de mise à jour |
| `swipes` | **Seulement les universités swipées**, avec en tête `Classement`, `Mon swipe`, `Mon score`. Classées comme le top 8 (score + bonus like / super like) ; les « pass » viennent à la fin, sans place. Dans l'Excel, chaque ligne est colorée : vert (like), or (super like), rouge (pass) |

| Paramètre | Valeurs | Effet |
|---|---|---|
| `kind` | `catalog` ou `swipes` | requis |
| `format` | `csv` ou `xlsx` | requis |
| `lang` | `fr` (défaut) ou `en` | en-têtes et libellés ; séparateur CSV `;` en français, `,` en anglais |

Réponse : le fichier en pièce jointe (`Content-Disposition`). Le CSV commence
par un BOM UTF-8 pour qu'Excel lise les accents (pas de couleurs en CSV : le
swipe reste lisible dans sa colonne) ; l'Excel a les en-têtes figés et un
filtre sur chaque colonne.

## Synchronisation 🔒

| Route | Réponse |
|---|---|
| `POST /sync` | `{ created, updated, deactivated, durationMs }` ; `502` si l'API mya est injoignable ou a changé de forme (rien n'est écrit) |
