# StockMaster Backend API

Backend Node.js/Express + TypeScript + MySQL pour StockMaster Pro.

## Prérequis

- Node.js 18+
- MySQL 5.7+ (XAMPP)
- npm ou yarn

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer la base de données MySQL :
```bash
# Option 1: Via MySQL CLI
mysql -u root -e "CREATE DATABASE IF NOT EXISTS stockmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Option 2: Via le script SQL fourni
mysql -u root < database/init.sql
```

3. Configurer l'environnement :
- Copier `.env.example` vers `.env` (si le fichier .env n'existe pas, créer un fichier `.env` avec le contenu suivant) :
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=stockmaster
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Exécuter les migrations :
```bash
npm run migration:run
```

5. Initialiser les données par défaut (utilisateurs, unités, catégories, etc.) :
```bash
npm run init-db
```

## Démarrage

Mode développement :
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## Structure du projet

```
backend/
├── src/
│   ├── config/          # Configuration (database, etc.)
│   ├── models/          # Modèles TypeORM
│   ├── controllers/     # Contrôleurs API
│   ├── routes/          # Routes API
│   ├── middleware/      # Middleware (auth, etc.)
│   ├── services/        # Services métier
│   └── scripts/         # Scripts utilitaires
├── database/
│   └── migrations/      # Migrations TypeORM
└── dist/                # Code compilé (généré)
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### Ventes
- `GET /api/sales` - Liste des ventes
- `GET /api/sales/:id` - Détails d'une vente
- `POST /api/sales` - Enregistrer une vente

### Clients
- `GET /api/customers` - Liste des clients
- `POST /api/customers` - Créer un client
- `PUT /api/customers/:id` - Modifier un client

### Inventaire
- `GET /api/inventory/movements` - Mouvements de stock
- `POST /api/inventory/adjustments` - Ajustement de stock
- `POST /api/inventory/sync-physical` - Synchroniser inventaire physique

### Autres endpoints
- `/api/categories` - Catégories
- `/api/units` - Unités
- `/api/suppliers` - Fournisseurs
- `/api/warehouses` - Dépôts
- `/api/cash/closings` - Clôtures de caisse
- `/api/cash/petty-cash` - Petite caisse
- `/api/audits` - Audits d'inventaire
- `/api/dashboard/stats` - Statistiques

## Migration des données

Pour migrer les données depuis localStorage :

1. Exporter les données depuis le navigateur :
   - Ouvrir la console du navigateur (F12)
   - Exécuter le code suivant pour exporter les données :
   ```javascript
   const data = {
     products: JSON.parse(localStorage.getItem('sm_products') || '[]'),
     categories: JSON.parse(localStorage.getItem('sm_categories') || '[]'),
     units: JSON.parse(localStorage.getItem('sm_units') || '[]'),
     customers: JSON.parse(localStorage.getItem('sm_customers') || '[]'),
     suppliers: JSON.parse(localStorage.getItem('sm_suppliers') || '[]'),
     warehouses: JSON.parse(localStorage.getItem('sm_warehouses') || '[]'),
     users: JSON.parse(localStorage.getItem('sm_users') || '[]'),
     sales: JSON.parse(localStorage.getItem('sm_sales') || '[]'),
     movements: JSON.parse(localStorage.getItem('sm_movements') || '[]'),
     closings: JSON.parse(localStorage.getItem('sm_closings') || '[]'),
     deposits: JSON.parse(localStorage.getItem('sm_deposits') || '[]'),
     audits: JSON.parse(localStorage.getItem('sm_audits') || '[]'),
     petty_cash: JSON.parse(localStorage.getItem('sm_petty_cash') || '[]'),
   };
   console.log(JSON.stringify(data, null, 2));
   ```
   - Copier le résultat JSON dans un fichier `migration-data.json`

2. Exécuter le script de migration :
```bash
npm run build
node dist/scripts/migrate-localStorage.js migration-data.json
```

## Notes importantes

- Toutes les routes (sauf `/api/auth/login`) nécessitent un token JWT dans le header `Authorization: Bearer <token>`
- Les mots de passe sont hashés avec bcrypt
- Les transactions DB sont utilisées pour les opérations critiques (ventes, ajustements)

