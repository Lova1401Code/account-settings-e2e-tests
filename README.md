# Account Settings E2E Tests

Tests End-to-End Playwright pour l'application Account Settings (AllMovies).

## Prérequis

- Node.js >= 18
- npm ou yarn

## Installation

```bash
npm install
npx playwright install
```

## Configuration

Les tests sont configurés pour s'exécuter contre l'environnement de production par défaut.

Pour tester sur un autre environnement, définissez la variable `BASE_URL` :

```bash
# Production (défaut)
npm test

# Autre environnement
BASE_URL=https://staging.allmovies2a.dev npm test

# Local
BASE_URL=http://localhost:5173 npm test
```

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter avec l'interface Playwright UI
npm run test:ui

# Exécuter avec le navigateur visible
npm run test:headed

# Mode debug (pas à pas)
npm run test:debug

# Afficher le rapport HTML
npm run test:report
```

## Structure des tests

```
tests/
├── test-config.js              # Configuration et helpers partagés
├── avatar-selection.spec.js    # Tests sélection d'avatar
├── change-email-backup-contact.spec.js
├── change-password.spec.js     # Tests changement de mot de passe
├── change-plan.spec.js         # Tests changement de plan
├── forgot-password.spec.js     # Tests récupération de mot de passe
├── homepage.spec.js            # Tests page d'accueil
├── language-settings.spec.js   # Tests paramètres de langue
├── manage-access.spec.js       # Tests gestion des accès
├── manage-devices.spec.js      # Tests gestion des appareils
├── membership.spec.js          # Tests abonnement
├── payment-method.spec.js      # Tests méthodes de paiement
├── preferences.spec.js         # Tests préférences
├── profile-activation.spec.js  # Tests activation de profil
├── profile-check-redirect.spec.js
├── profile-management.spec.js  # Tests gestion des profils
├── signin.spec.js              # Tests connexion
├── signup.spec.js              # Tests inscription
├── subscription-payment.spec.js # Tests paiement abonnement
└── switch-profile.spec.js      # Tests changement de profil
```

## Rapports

Les rapports de tests sont générés dans :
- `test-results/` - Résultats bruts
- `playwright-report/` - Rapport HTML

Pour voir le rapport HTML après exécution :
```bash
npm run test:report
```

## Notes

- Les tests utilisent des credentials réels définis dans `test-config.js`
- Pour la CI/CD, utilisez des variables d'environnement pour les credentials
- Les timeouts sont configurés pour les tests sur environnement distant (120s par test)

