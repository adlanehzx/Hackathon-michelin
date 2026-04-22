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

### 1. Setup des Variables d'Environnement

```bash
# Copier les templates
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Puis éditer les fichiers `.env` avec vos credentials Supabase:

**backend/.env:**

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-api-key
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

**frontend/.env:**

```
API_URL=http://localhost:3000/api
```

### 2. Installation & Démarrage

```bash
# Installer les dépendances
cd backend && npm install
cd ../frontend && npm install && cd ..

# Démarrer avec Docker Compose
cd backend && docker compose up -d

# Démarrer le frontend (depuis frontend/)
npx expo start --web
```

**Accès:**

- Frontend web: http://localhost:8081
- Backend API: http://localhost:3000/api
- Expo: http://localhost:8081

## Prochaines Étapes

- [ ] Intégration de la carte (Google Maps/Mapbox)
- [ ] Implémentation du feed
- [ ] Édition du profil utilisateur
- [ ] Fonctionnalités métier Michelin
