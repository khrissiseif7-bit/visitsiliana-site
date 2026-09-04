# Visit Siliana — Site web

Site touristique statique (HTML/CSS/JS) pour le gouvernorat de Siliana, Tunisie.
Multilingue **FR / AR / EN** (arabe en RTL), optimisé pour Firebase Hosting.

## Structure

```
visitsiliana-site/
├── index.html              # Page d'accueil
├── pages/
│   ├── experiences.html    # Expériences & Aventures (liste)
│   ├── escalade.html       # Détail activité (30 DT, Aïn Boussaâdia)
│   ├── randonnee.html      # Détail activité (20 DT, Mont Bargou)
│   ├── speleologie.html    # Détail activité (50 DT, Jbel Serj)
│   ├── patrimoines.html    # Histoires & Patrimoines
│   ├── hebergements.html   # Hébergements Alternatifs
│   ├── gastronomie.html    # Gastronomie Locale
│   ├── artisanat.html      # Artisanat
│   └── evenements.html     # Évènements
├── css/style.css           # Styles (responsive + RTL)
├── js/
│   ├── i18n.js             # Système multilingue FR/AR/EN
│   └── main.js             # Menu, dropdown, galerie, formulaires
├── images/                 # Tous les médias (.avif)
├── firebase.json           # Config Firebase Hosting
└── .firebaserc             # ID du projet Firebase
```

## Développement local

```bash
# Depuis le dossier du projet
python -m http.server 8080
# Ouvrir http://127.0.0.1:8080
```

## Déploiement Firebase

1. Installer les outils (une seule fois) :
   ```bash
   npm install -g firebase-tools
   ```
2. Se connecter :
   ```bash
   firebase login
   ```
3. Renseigner l'ID de ton projet dans `.firebaserc` (remplace `TON_PROJET_ID`).
4. Déployer :
   ```bash
   firebase deploy --only hosting
   ```

## Domaine Cloudflare

Après le premier déploiement, dans la console Firebase :
**Hosting → Ajouter un domaine personnalisé → `visitsiliana.com`**
Firebase fournira des enregistrements DNS (A / TXT) à ajouter dans Cloudflare.
⚠️ Passer les enregistrements en **DNS only** (nuage gris) le temps de la vérification.

## Système d'avis (Firebase Firestore)

Reproduit le système modéré de l'ancien site : sur chaque page d'activité
(Escalade, Randonnée, Spéléologie), les visiteurs laissent un avis (nom, email,
note ⭐, texte ≤700 car.). L'avis est stocké dans Firestore avec `status: "pending"`
et n'apparaît qu'après ta validation.

**Activation (une fois le projet Firebase créé) :**
1. Console Firebase → crée le projet (ex: `visitsiliana`) → active **Firestore Database**.
2. Console → Paramètres du projet (⚙️) → Vos applications → App Web → copie la config
   et colle-la dans `js/firebase-config.js` (remplace les `A_REMPLIR`).
3. Déploie les règles de sécurité :
   ```bash
   firebase deploy --only firestore:rules
   ```
   (règles dans `firestore.rules` : lecture des avis approuvés uniquement,
   création forcée en `pending`, pas de modif/suppression côté client.)

**Modérer les avis :**
Console Firebase → Firestore → collection `reviews` → ouvre l'avis reçu
(`status: pending`) → change `status` en `approved` pour le publier.
Pour refuser : supprime le document.

**Modèle d'un avis** : `{ activity, name, email, rating (1-5), text, status, createdAt }`

## Formulaire de contact (EmailJS — 2 emails, 2 templates)

À l'envoi du formulaire, **deux emails** partent :
- **au contact** (`contact@visitsiliana.com`) avec les détails du message → *template CONTACT*
- **au visiteur** (l'email qu'il a saisi) en accusé de réception → *template VISITEUR*

**Activation (compte gratuit, ~5 min) :**
1. Crée un compte sur https://www.emailjs.com
2. **Email Services** → ajoute un service (Gmail/Outlook/SMTP) → note le **Service ID**
3. **Account → General** → copie la **Public Key**
4. **Email Templates** → crée **2 templates** :
   - *Template CONTACT* : dans « To Email » mets `contact@visitsiliana.com`
   - *Template VISITEUR* : dans « To Email » mets `{{email}}`
   - Variables utilisables : `{{name}}` `{{email}}` `{{message}}` `{{date}}` `{{owner_email}}`
5. Colle les 4 identifiants dans `js/emailjs-config.js`.

**Exemple — Template CONTACT** (sujet : `Nouveau message de {{name}}`) :
```
Nouveau message depuis visitsiliana.com

Nom    : {{name}}
Email  : {{email}}
Date   : {{date}}

Message :
{{message}}
```
**Exemple — Template VISITEUR** (sujet : `Merci pour votre message, {{name}} !`) :
```
Bonjour {{name}},

Merci de nous avoir contactés. Nous avons bien reçu votre message
et nous vous répondrons dans les plus brefs délais.

Votre message :
{{message}}

— L'équipe Visit Siliana
```

Tant que `emailjs-config.js` n'est pas rempli, le bouton affiche « Emailing non configuré » (aucune erreur bloquante). Quota gratuit : 200 emails/mois.

## À compléter plus tard

- Traductions arabe/anglais des pages secondaires (patrimoines, hébergements…) — actuellement le contenu détaillé de ces pages est en français ; les titres/descriptions sont déjà traduits.
- Connexion réelle du formulaire de contact (ex : Firebase Functions, Formspree, ou EmailJS).
- Contenu réel des sections Blog et Partenaires.
- Optimisation des 3 images de « Expériences et Aventures » (~650–950 Ko).
