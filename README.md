# Hackathon Michelin

Application mobile pour le hackathon Michelin construite avec React Native, Expo et un backend Express.

## Stack technique

**Frontend**

- React Native + Expo
- TypeScript
- React Context API
- Axios

**Backend**

- Express.js + TypeScript
- JWT
- Bcrypt
- Supabase PostgreSQL
- Resend pour l'envoi des emails transactionnels

## Fonctionnalités d'authentification

- Inscription
- Connexion
- Déconnexion
- Mot de passe oublié par code de 8 caractères envoyé par email
- Réinitialisation du mot de passe avec `email + code + nouveau mot de passe`

## Variables d'environnement

### `backend/.env`

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
SUPABASE_CLIENT_KEY=your-supabase-anon-or-publishable-key
JWT_SECRET=your-secret-key-here
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=no-reply@your-domain.com
RESEND_FROM_NAME=Michelin Hackathon
RESEND_REPLY_TO=support@your-domain.com
PASSWORD_RESET_CODE_TTL_MINUTES=15
```

### `frontend/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Lancement

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npx expo start
```

Implémentation du feed

- [ ] Édition du profil utilisateur
- [ ] Fonctionnalités métier Michelin
