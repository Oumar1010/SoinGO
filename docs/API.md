# SoinGo API Documentation

Base URL: `http://localhost:3000/api`
Swagger UI: `http://localhost:3000/api/docs`

## Authentification

Tous les endpoints (sauf `/auth/login`) nécessitent un Bearer token JWT.

```
Authorization: Bearer <token>
```

---

## Auth

### POST /auth/login
```json
{ "email": "oumar1010@soingo.com", "password": "Amie1010" }
```
Réponse: `{ access_token, user: { id, nom, email, role } }`

---

## Users

| Méthode | Endpoint      | Description           | Rôle requis |
|---------|---------------|-----------------------|-------------|
| POST    | /users        | Créer utilisateur     | ADMIN       |
| GET     | /users        | Lister utilisateurs   | ADMIN/COORDO |
| GET     | /users/:id    | Détail utilisateur    | any         |
| DELETE  | /users/:id    | Supprimer utilisateur | ADMIN       |

---

## Patients

| Méthode | Endpoint        | Description                    |
|---------|-----------------|--------------------------------|
| POST    | /patients       | Créer (géocodage auto)         |
| GET     | /patients       | Lister tous                    |
| GET     | /patients/:id   | Détail                         |
| PUT     | /patients/:id   | Mettre à jour                  |
| DELETE  | /patients/:id   | Supprimer                      |

---

## Visits

| Méthode | Endpoint       | Description                                    |
|---------|----------------|------------------------------------------------|
| POST    | /visits        | Planifier une visite                           |
| GET     | /visits        | `?date=2025-05-05&aideSoignantId=xxx`          |
| GET     | /visits/:id    | Détail                                         |
| PUT     | /visits/:id    | Mettre à jour (statut, notes, horaire...)      |
| DELETE  | /visits/:id    | Supprimer                                      |

### Statuts de visite
- `PLANIFIE` → `EN_COURS` → `TERMINE`
- `ANNULE` (depuis n'importe quel état)

---

## Routes (Optimisation)

### POST /routes/optimize
```json
{
  "aideSoignantId": "claid...",
  "date": "2025-05-05",
  "visitIds": ["id1", "id2", "id3"]
}
```
Algorithme: **Nearest Neighbor** via Google Distance Matrix API.

### GET /routes?date=2025-05-05&aideSoignantId=xxx
Retourne la tournée optimisée pour la date/aide-soignant.
