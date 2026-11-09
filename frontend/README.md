# CampusFlow — frontend React

Frontend indépendant de l’application universitaire existante. Il utilise React, TypeScript, Vite et se connecte à l’API Flask du dossier `../backend`.

## Démarrage local

1. Démarrer PostgreSQL et configurer `backend/.env`.
2. Démarrer l’API Flask sur le port 5001, depuis `backend/` :

   ```powershell
   .\.venv\Scripts\python.exe run.py
   ```

3. Depuis ce dossier `frontend/`, installer les dépendances puis lancer Vite :

   ```powershell
   npm install
   npm run dev
   ```

4. Ouvrir l’adresse indiquée par Vite, par défaut `http://127.0.0.1:5173`.

En développement, Vite transmet `/api` à Flask sur le port 5001. Pour viser une autre API lors de la compilation, définir `VITE_API_BASE_URL`, par exemple `https://api.example.org/api`.

## Commandes

- `npm run dev` : serveur local Vite.
- `npm run build` : vérification TypeScript et compilation de production dans `dist/`.
- `npm run lint` : vérification statique.

Les connexions et inscriptions nécessitent une base initialisée. Les comptes de démonstration visibles sur l’écran de connexion ne contournent pas l’API.
