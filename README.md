# 🏆 psn-trophy-leaderboard-api

> **Projet en cours de développement** Ce projet est actuellement en phase de construction active.

## Présentation
Un moteur de classement conçu pour une communauté de chasseurs de trophée. 
Cette API permet de synchroniser les performances des joueurs PlayStation et d'attribuer des points selon un barème personnalisable.

## Fonctionnalités (en cours)
- **Synchro Auto** : Récupération des trophées via l'API officielle Sony.
- **Scoring** : Système de points unique basé sur un barème CSV personnalisable.
- **Gestion de Communauté** : Inscription simplifiée via pseudo PSN ou Discord.
- **Performance** : Développé avec Bun pour une exécution ultra-rapide.

## Sources & Crédits
Ce projet s'appuie sur des outils open-source de qualité :
- **[PSN-API](https://github.com/achievements-app/psn-api)** : Utilisation de `psn-api` pour communiquer avec les services Sony.
- **Sony PlayStation** : Toutes les données de jeux et de trophées proviennent des services officiels PlayStation.
- **Drop Ton Platine** : Barème de points fourni par le fichier de référence `FICHIER_DES_POINTS_DTP.csv`.

## Tech Stack
- **Runtime** : [Bun](https://bun.sh/)
- **Framework** : Express
- **Base de données** : SQLite avec [Prisma ORM](https://www.prisma.io/)
- **Langage** : TypeScript

## État d'avancement
### Finalisé :
- Authentification OAuth2 & Rotation des Tokens
- Modèle de base de données (Joueurs / Jeux)
### En cours :
- Importation automatique du barème CSV
- Calculateur de score automatique
- Système de file d'attente 
