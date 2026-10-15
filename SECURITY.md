# Sécurité

## Signaler une vulnérabilité

**N'ouvre pas d'issue publique** pour une faille de sécurité.

Utilise le signalement privé de GitHub :
[Security → Report a vulnerability](https://github.com/VictorTV57/campus-match/security/advisories/new).
Décris la faille, comment la reproduire et son impact. Tu recevras une réponse
dès que possible ; le correctif est publié avant que la faille ne soit rendue
publique.

## Périmètre

CampusMatch est un projet personnel, pensé pour tourner en local. Sont
notamment dans le périmètre : l'authentification (JWT, mots de passe), la
validation des entrées de l'API, l'affichage du contenu importé depuis
mya.epitech.eu (liens et images filtrés côté back et côté front).

## Limites connues

Elles sont assumées pour un outil local et ne sont pas à signaler :

- **Refresh tokens non révocables** : ils ne sont pas stockés en base, donc
  valables jusqu'à expiration (7 jours par défaut), sans rotation. La
  déconnexion ne fait qu'effacer le token côté navigateur.
- **Refresh token dans le `localStorage`** du navigateur (et non dans un
  cookie `httpOnly`) : exposé en cas de faille XSS.
- **`POST /sync`** est accessible à tout utilisateur connecté (pas de rôle
  administrateur).
- Pas de limitation du nombre de tentatives de connexion.

## Bonnes pratiques pour les contributeurs

- Ne jamais commiter `back/.env`, une base `*.db` ou un secret.
- Générer des secrets JWT aléatoires et différents l'un de l'autre
  (voir [CONTRIBUTING.md](CONTRIBUTING.md#2-installer-le-projet)).
- Toute nouvelle route : DTO `class-validator` et `JwtAuthGuard` si elle
  touche aux données d'un utilisateur.
