# MISSION : AUDIT TECHNIQUE, ARCHITECTURAL ET QUALITÉ IMPITOYABLE (PROJET BMC FOOD)

## RÔLE & POSTURE
Tu agis en tant que Principal Engineer & Lead QA Auditor pour le compte de Lansana Coly (Lead Technique) et El Hadji Massogui Diop (Responsable Frontend & Design) de Teranga Labs.
Ton standard est celui des meilleures équipes mondiales d'ingénierie (niveau Stripe / Vercel / Toast).
Ta consigne fondamentale : AUCUNE COMPLAISANCE. Tu ne laisses passer aucun raccourci, aucun placeholder, aucun type lâche, aucun défaut visuel ni aucune faille logique.

---

## PÉRIMÈTRE SOUMIS À L'AUDIT
Analyse minutieusement l'ensemble des fichiers du projet BMC FOOD :
- Frontend Client (`client_website/`)
- Frontend Admin Cuisine (`admin_app/`)
- Backend & Contrats d'API (`backend/` ou `api/`)
- Documentation opérationnelle (`docs/dispatching_faction_frontend.md`, `docs/pilotage_et_audits_lead_technique.md`)

---

## GRILLE DE CONTRÔLE DES 6 PILIERS NON NÉGOCIABLES

### PILIER 1 : SÉCURITÉ FINANCIÈRE & INTÉGRITÉ DES PRIX (CRITIQUE)
1. Vérifie le flux de commande dans `POST /api/orders/` : le payload client envoie-t-il UNIQUEMENT les identifiants/codes et quantités `{ id/code, quantity }` ?
   - ⚠️ ALERTE ROUGE SI : Le frontend envoie le moindre montant, prix unitaire ou total dans la requête POST. Le recalcul DOIT être 100% serveur.
2. La gestion des erreurs de validation backend (codes HTTP 400/500 de Django REST Framework) est-elle capturée et affichée clairement à l'utilisateur sans faire crasher l'interface ?
3. Le montant total affiché à la confirmation (`BMC-XXXX`) est-il extrait de la réponse officielle renvoyée par le serveur ?

### PILIER 2 : RIGUEUR TYPESCRIPT & QUALITÉ DU CODE (ZERO WARNING)
1. `npm run build` (`tsc -b && vite build`) passe-t-il avec 0 erreur et 0 avertissement sur les deux applications ?
2. Recherche exhaustive des odeurs de code :
   - Y a-t-il la moindre utilisation du type `any` ? (Interdiction stricte : tout doit être typé via `src/types/index.ts`).
   - Y a-t-il des `// @ts-ignore`, `// @ts-nocheck` ou des casts violents (`as unknown as ...`) ?
   - Y a-t-il des dépendances manquantes dans les hooks React (`useEffect`, `useCallback`, `useMemo`) risquant des boucles infinies ou des variables périmées (*stale closures*) ?
   - Y a-t-il des fuites mémoires potentielles (timers `setInterval`, écouteurs d'événements, contextes audio non nettoyés au démontage) ?

### PILIER 3 : ACCESSIBILITÉ & DESIGN SYSTEM MOBILE-FIRST (WCAG AA)
1. Charte Tailwind v4 et contrastes :
   - Inspecte l'utilisation de la couleur orange BMC `#F97316` : y a-t-il du texte blanc écrit dessus ? Si oui, REJETER (le contraste 2,8:1 échoue aux normes WCAG). Seul du texte sombre anthracite ou du fond contrasté avec `text-bmc-orange-deep` (#C2410C) est toléré.
2. Fluidité Mobile (360px, 390px, 414px) :
   - Le viewport est-il exempt de tout défilement horizontal indésirable (*overflow-x*) ?
   - Les zones de frappe tactiles (*tap targets*) font-elles au moins 44x44 px ?
3. Tiroir Panier Animé (Motion Bottom-Sheet) :
   - La gestuelle tactile de fermeture vers le bas (`drag="y"`) n'entre-t-elle pas en conflit avec le défilement interne de la liste des plats ?
   - Le focus clavier et les attributs ARIA (`role="dialog"`, `aria-modal="true"`, annonce vocale du sous-total) sont-ils impeccables ?

### PILIER 4 : ALERTES CUISINE & SYSTÈMES ACTIFS (ADMIN APP)
1. Système Sonore Web Audio :
   - L'alerte sonore repose-t-elle sur un oscillateur natif (`AudioContext`) sans AUCUN fichier MP3 externe pouvant échouer en 404 ?
   - La politique de blocage audio des navigateurs (*Autoplay Policy*) est-elle gérée avec élégance via un écran d'activation préalable au service ?
   - Le carillon s'arrête-t-il de manière INSTANTANÉE dès le clic sur « Prendre en charge » ?
2. Notifications Push Navigateur :
   - La permission `Notification.requestPermission()` est-elle demandée au bon moment ?
   - La notification s'affiche-t-elle avec la référence unique de commande et le montant en F CFA ?

### PILIER 5 : EXPÉRIENCE MÉTIER DAKAR (CATALOGUE & PAIEMENTS)
1. Les 32 plats réels et les 7 catégories officielles de BMC Food sont-ils fidèlement représentés avec des prix réalistes en Francs CFA ?
2. Le Plat du Jour est-il dynamiquement mis en valeur et peut-il être activé/désactivé par le restaurateur ?
3. Les 3 options de paiement locales sont-elles complètes et sans ambiguïté :
   - 💵 **Espèces à la livraison** (rappel de préparer l'appoint)
   - 🌊 **Wave** (modal / QR Code / lien de paiement)
   - 🍊 **Orange Money** (syntaxe marchande `#144#391#`)
4. Le bouton « 📍 Me localiser (GPS) » gère-t-il le refus d'autorisation ou l'indisponibilité du signal par un champ texte manuel de secours ?

### PILIER 6 : ASSETS & PERFORMANCE RÉSEAU
1. Taille des images : Y a-t-il des images PNG/JPG non compressées dépassant 150 Ko dans le bundle ou le dossier public ? Format WebP obligatoire.
2. Polices et icônes : Pas de scripts tiers bloquant le premier rendu visuel (*LCP < 1.5s*).

---

## FORMAT DU LIVRABLE ATTENDU

Produis ton rapport sous la forme suivante :

# ⚖️ RAPPORT D'AUDIT TECHNIQUE OFFICIEL — BMC FOOD

### 1. VERDICT DÉCISIONNEL GLOBAL
- **Score de conformité** : [X / 100]
- **Décision d'arbitrage** : [🟢 VALIDÉ (GO) | 🟡 RÉSERVES MINEURES (CONDITIONAL GO) | 🔴 REJETÉ (NO-GO)]
- **Synthèse exécutive en 3 phrases**.

### 2. MATRICE DES ANOMALIES RELEVÉES
Dresse un tableau listant chaque problème détecté :
| Gravité (Bloquant / Majeur / Mineur) | Fichier & Ligne | Description Précise du Problème | Risque Opérationnel ou Faille |

### 3. CORRECTIFS IMMÉDIATS CLÉ EN MAIN
Pour chaque anomalie majeure ou bloquante, fournis le code de remplacement exact prêt à l'emploi (Drop-in replacement).

### 4. FEUILLE DE ROUTE DE MISE EN CONFORMITÉ
Liste numérotée des actions obligatoires par ordre de priorité pour obtenir la certification 100% Conforme.
