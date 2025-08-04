# 🚀 Guide de Déploiement Vercel - BigWater

## ✅ Statut : PRÊT POUR LE DÉPLOIEMENT

Votre application Next.js est entièrement prête pour être déployée sur Vercel.

## 📋 Prérequis

- Repository Git pushé (✅ Fait)
- Build réussie localement (✅ Testé)
- Variables d'environnement configurées

## 🔧 Déploiement sur Vercel

### 1. Connecter le Repository

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez votre repository `bigwater`
5. Cliquez sur **"Import"**

### 2. Configuration des Variables d'Environnement

Dans l'interface Vercel, ajoutez ces variables :

```bash
# Supabase (OBLIGATOIRES)
NEXT_PUBLIC_SUPABASE_URL=https://joyerqoqhfhqjyncunzp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase

# Telegram Bot (OBLIGATOIRE)
TELEGRAM_BOT_TOKEN=votre_token_telegram_bot
```

### 3. Déploiement

1. Vérifiez que le **Framework Preset** est sur **"Next.js"**
2. **Build Command** : `npm run build` (par défaut)
3. **Output Directory** : `.next` (par défaut)
4. Cliquez sur **"Deploy"**

## 🌐 Après le Déploiement

### URLs de votre application :

- **Homepage** : `https://votre-app.vercel.app`
- **Dashboard** : `https://votre-app.vercel.app/dashboard`
- **Tirage** : `https://votre-app.vercel.app/wheel`
- **Login** : `https://votre-app.vercel.app/login`

### Configuration du Webhook Telegram :

1. Connectez-vous au dashboard
2. Utilisez le bouton **"Configurer Webhook"**
3. L'URL sera automatiquement : `https://votre-app.vercel.app/api/webhook/telegram`

## 🔒 Sécurité

- ✅ Fichiers `.env*` exclus du repository
- ✅ Variables sensibles dans l'interface Vercel
- ✅ Authentification Supabase configurée
- ✅ Middleware de protection des routes

## 📊 Fonctionnalités Déployées

- ✅ Système d'authentification complet
- ✅ Dashboard administrateur
- ✅ Bot Telegram intégré
- ✅ Roue de tirage au sort interactive
- ✅ Gestion des participants
- ✅ APIs sécurisées
- ✅ Interface responsive

## 🚨 Points d'Attention

1. **Domaine personnalisé** : Configurez votre domaine dans Vercel
2. **Webhook Telegram** : Reconfigurer après le premier déploiement
3. **Supabase** : Vérifiez que l'URL de production est autorisée
4. **Variables d'environnement** : Bien copier depuis votre `.env.local`

## 🛠️ Commandes de Vérification

```bash
# Tester la build localement
npm run build

# Tester en local (production)
npm run start

# Vérifier les types
npm run lint
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs Vercel
2. Testez localement avec `npm run build`
3. Vérifiez les variables d'environnement
4. Consultez la documentation Vercel

---

**Status** : ✅ Application prête pour la production
**Build** : ✅ Réussie (15 routes générées)
**Sécurité** : ✅ Variables protégées
**Performance** : ✅ Optimisée (99.6 kB shared JS)
