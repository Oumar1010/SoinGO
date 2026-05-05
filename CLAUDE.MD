## Projet : SoinGo

### 1. Objectif
SoinGo est une application SaaS destinée aux structures de soins à domicile.  
Elle permet :
- d’organiser les tournées des aides-soignants,
- d’optimiser les trajets via géolocalisation,
- de simplifier le travail sur iPad,
- d’améliorer la coordination via un back-office moderne.

---

### 2. Architecture technique
- **Backend :** NestJS + TypeScript + Prisma + PostgreSQL  
- **Frontend Web :** React + Tailwind CSS + @react-google-maps/api  
- **PWA iPad :** React PWA optimisée pour iPad  
- **Auth :** JWT + RBAC (ADMIN, COORDO, AIDE_SOIGNANT)  
- **Services externes :** Google Geocoding API, Google Distance Matrix API  
- **CI/CD :** GitHub Actions  
- **Hébergement :** Railway / Render / AWS  
- **Base de données :** PostgreSQL managé  
- **Stockage :** S3 compatible  

---

### 3. Structure du dossier
/SoinGo
├── backend
├── frontend
├── pwa
├── images
│   ├── favicon_16x16.png
│   ├── favicon_32x32.png
│   ├── app_icon_iPad_1024.png
│   ├── logo_color_full.png
│   ├── logo_monochrome_black.png
│   └── logo_monochrome_white.png
└── docs

---

### 4. Design system à respecter
#### Palette de couleurs
| Élément | HEX | Usage |
|----------|------|--------|
| Bleu Santé | `#2D8CFF` | Actions principales, texte “Soin”, icône médicale |
| Orange Dynamique | `#FF9F43` | Texte “Go”, accents, éléments de route |
| Vert Confiance | `#2ECC71` | Validation, succès, point d’arrivée |
| Blanc Pur | `#FFFFFF` | Fond clair, contraste |
| Gris Neutre | `#F5F6FA` | Arrière-plan, cartes, UI |

#### Typographie
- **Police principale :** Inter ou SF Pro Rounded  
- **Taille :** 18–20px sur iPad  
- **Style :** moderne, lisible, arrondi  

#### Icônes
- HeroIcons ou SF Symbols  
- Taille minimale : 32px  
- Icônes + texte obligatoire  

#### Boutons
- Hauteur : 56–64px  
- Coins arrondis : 12–16px  
- Couleur primaire : bleu  
- Couleur secondaire : gris clair  
- Accent : orange pour actions rapides, vert pour validation  

#### UX iPad
- Maximum 2 actions principales par écran  
- Gros tap targets (≥44px)  
- Mode contraste élevé optionnel  
- Navigation simple : Planning | Carte | Profil  

---

### 5. Modèle de données (Prisma)
- **User** : id, nom, email, rôle, hash_mdp  
- **Patient** : id, nom, address_raw, lat, lng, access_info  
- **Visit** : id, patient_id, aide_soignant_id, date_heure, durée, statut, notes  
- **Route** : id, aide_soignant_id, date, liste ordonnée, distance_totale, temps_total  

---

### 6. Prompts Claude Code

#### Backend
Crée un projet NestJS nommé soingo-backend avec :

modules Auth, Users, Patients, Visits, Routing

Prisma + PostgreSQL

géocodage via Google Geocoding API

optimisation via Google Distance Matrix

endpoint POST /routes/optimize

contrôleurs, services, DTO, tests unitaires

#### Frontend Web
Crée un dashboard React pour SoinGo avec :

liste des visites du jour

carte Google Maps avec polylines

bouton Optimiser

design system SoinGo (couleurs, icônes, boutons)

Tailwind ou MUI

#### PWA iPad
Crée une PWA React optimisée iPad pour SoinGo avec :

vues Planning, Carte, Profil

boutons larges (56–64px)

icônes HeroIcons

palette SoinGo

navigation GPS via Plans / Google Maps

mode offline léger

---

### 7. Instructions pour Claude
Claude doit :
- Générer le code complet du projet SoinGo.  
- Respecter le design system et les couleurs du logo.  
- Utiliser les images du dossier `/SoinGo/images`.  
- Produire un backend, un frontend web et une PWA iPad fonctionnels.  
- Inclure la documentation API et les tests unitaires.  

---

### 8. Résultat attendu
- Backend NestJS complet  
- Frontend React complet  
- PWA iPad complète  
- Design system intégré  
- Documentation API  
- Dossier images conforme au branding SoinGo  

### 9. User pour les TESTs
- admin : 
  user :  oumar1010
   mot de passe : Amie1010
- utilisateur : 
    user : amie1010
    mot de passe : jiji



