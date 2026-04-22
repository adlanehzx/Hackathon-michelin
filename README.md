# Hackathon Michelin

Application mobile pour le hackathon Michelin construite avec React Native et Expo.

## Stack Technique

**Frontend:**

- React Native + Expo (SDK 54)
- TypeScript
- React Context API pour l'authentification
- AsyncStorage pour la persistance des tokens
- Axios pour les API calls

**Backend:**

- Express.js + TypeScript
- JWT authentification
- Bcrypt pour le hash des mots de passe
- Supabase PostgreSQL

**Infrastructure:**

- Docker & Docker Compose
- Node.js 20.18

## Fonctionnalités Implémentées

✅ **Authentification**

- Register avec validation (nom, prénom, email, mot de passe)
- Login avec JWT (7 jours d'expiration)
- Logout avec suppression du token
- Context API pour gérer l'état d'authentification

✅ **Architecture**

- Backend modulaire (controllers, routes, middleware, config)
- Frontend avec navigation par onglets (3 screens)
- Séparation des responsabilités

✅ **UI/UX**

- Écran de Profil (nom, prénom, email, bouton déconnexion)
- Écrans Placeholder pour Map et Feed
- Styles épurés et simples

## Démarrage Rapide

```bash
# Cloner et installer
git clone https://github.com/adlanehzx/Hackathon-michelin.git
cd Hackathon-michelin

# Variables d'environnement
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Démarrer avec Docker
docker compose up -d
```

**Accès:**

- Frontend web: http://localhost:8081
- Backend API: http://localhost:3000/api
- Expo: ports 19000-19001

## Prochaines Étapes

- [ ] Intégration de la carte (Google Maps/Mapbox)
- [ ] Implémentation du feed
- [ ] Édition du profil utilisateur
- [ ] Fonctionnalités métier Michelin
