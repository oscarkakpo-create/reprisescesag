# 📘 Dossier de Passation & Documentation Technique — Reprises CESAG (2026-2027)

Ce document rassemble l'intégralité du contexte, de l'architecture, des choix techniques, des fonctionnalités implémentées et des consignes opérationnelles pour permettre à tout agent ou collaborateur de reprendre immédiatement le projet.

---

## 1. Contexte & Objectifs du Projet

L'application web **Reprises CESAG** est une plateforme autonome conçue pour le **CESAG** (*Centre Africain d'Études Supérieures en Gestion*, Dakar) couvrant l'ensemble des directions de formation.

Elle permet aux étudiants inscrits en reprise de modules de :
1. Choisir leur **Direction pédagogique**, leur **Programme / Filière** et leur **Classe / Niveau** de manière fluide en cascade.
2. Composer leur panier d'Unités d'Enseignement (UE) / matières à reprendre avec calcul automatique des volumes horaires, des frais et indication du nom de l'**enseignant(e)**.
3. Déclarer une éventuelle exonération (maladie ou inscription tardive sur justificatif) avec intégration automatique de la photo justificative en Annexe.
4. Signer numériquement au doigt ou à la souris sur écran tactile.
5. Transmettre automatiquement leur dossier à la base de données centrale (**Google Sheets via Google Apps Script**) et recevoir instantanément une **copie récapitulative par email**.
6. Générer et imprimer deux documents officiels en haute fidélité vectorielle sur **une seule page sans aucun onglet** :
   - **La Fiche d'inscription pédagogique aux reprises** (avec QR Code de vérification et annexe).
   - **La Lettre officielle de demande adressée à Mme le Directeur Général du CESAG** (service courrier).

---

## 2. Environnement de Travail & Dépôt Git

- **Dépôt distant GitHub :** `https://github.com/oscarkakpo-create/reprisescesag.git`
- **Branche principale de production :** `main`
- **Répertoire local :** `C:\Users\Digi Face\.gemini\antigravity\scratch\reprisescesag`
- **Bureau OneDrive utilisateur :** `C:\Users\Digi Face\OneDrive - Centre Africain d'Etudes Supérieures en Gestion (CESAG)\Bureau\DOCUMENTATION_REPRISES_CESAG.md`
- **Fichiers clés :**
  - [index.html](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/index.html) : Application SPA autonome HTML5/CSS3/Vanilla JS (aucune dépendance externe bloquante).
  - [Code.gs](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/Code.gs) : Backend Google Apps Script (Webhook doPost, Google Sheet + envoi automatique d'email récapitulatif via MailApp).
  - [logo-cesag.jpg](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/logo-cesag.jpg) : Logo officiel CESAG (intégré en Base64 dans `index.html`).

---

## 3. Organisation par Direction & Offres Académiques

Conformément à l'organigramme officiel du CESAG (Décision n°007-03-2026), l'application structure les formations selon deux grandes directions :

### 3.1. DPGELM — Direction des Programmes Grande École, Licences et Masters
- **Licence en Gestion (LG) :**
  - `LG 1 — Licence en Gestion`
  - `LG 2 — Licence en Gestion`
  - `LG 3 — Entrepreneuriat et Gestion des Projets (EGP)`
  - `LG 3 — Techniques Comptables et Financières (LTCF)`
  - `LG 3 — Techniques Bancaires et Financières (TBF)`
- **Licence en Comptabilité, Contrôle et Audit (LCCA) :**
  - `LCCA 1 — Licence en Comptabilité, Contrôle et Audit`
  - `LCCA 2 — Licence en Comptabilité, Contrôle et Audit`
  - `LCCA 3 — Comptabilité, Contrôle et Audit`
- **Masters & Programme Grande École :**
  - `Master 1 — Banque, Finance, Comptabilité, Contrôle et Audit (BF-CCA)`
  - `Master 2 — Banque, Finance, Comptabilité, Contrôle et Audit (BF-CCA)`
  - `Master 1 — Management des Entreprises et Organisations (MEO)`
  - `Master 2 — Management des Entreprises et Organisations (MEO)`
  - `Master — Programme Grande École (PGE)`

### 3.2. DPECN — Direction du Programme Executive et Campus Numérique
- **CESAG Expertise Comptable :**
  - `DECOGEF (Cycle Expertise Comptable UEMOA)`
  - `DESCOGEF (Cycle Expertise Comptable UEMOA)`
- **CESAG Executive & Formation Continue :**
  - `Executive MBA & Formations Professionnelles Certifiantes`
- **CESAG Économie de la Santé :**
  - `Master Économie de la Santé & Management des Services de Santé`
- **CESAG Online / Campus Numérique :**
  - `Formations en Ligne & Campus Numérique`

---

## 4. Parcours Unique "Single-Page" (Zéro Onglet)

- **Flux linéaire complet sur une même page :**
  1. *Étape 0 — Orientation académique :* Direction $\rightarrow$ Programme $\rightarrow$ Classe.
  2. *Étape 1 — Identification :* Nom, Prénom, Matricule, Promotion, Email (avec accusé de réception), Téléphone.
  3. *Étape 2 — Matières :* Sélection des modules avec saisie optionnelle du nom de l'**Enseignant(e)**.
  4. *Étape 3 — Récapitulatif financier :* 2 500 FCFA/h + 25 000 FCFA forfaitaires, option d'exonération avec upload de justificatif.
  5. *Étape 4 — Signature :* Signature tactile au doigt ou à la souris sur canvas synchronisé.
  6. *Étape 5 — Dossier complet généré :* **Zéro onglet**. La Fiche d'inscription et la Lettre officielle à Mme le DG sont affichées l'une après l'autre sur la page.
  7. *Impression haute fidélité :* Bouton `🖨️ Imprimer / PDF — Dossier complet` générant les deux pièces en format vectoriel sans coupure (avec saut de page strict en CSS).

---

## 5. Backend Google Apps Script & Notification Automatique

- **Google Sheet ID :** `1tjgolQprcPfvmkJbS1kUbuheEwJCWc_qy9WsA8STSpw`
- **Webhook WebApp :** `https://script.google.com/macros/s/AKfycbzOUJglQOsxRlDs0ysZJWuQQXrumfTiGU1znHO2eWUsdUv3PGa8n6V5BotBquBo1OBoYQ/exec`
- **Envoi automatique de copie email :** Dès réception de la demande, `MailApp.sendEmail` transmet un récapitulatif détaillé au demandeur (référence, liste des matières, heures, montant, enseignant et contacts du secrétariat).

---

## 6. Guide Opérationnel de Validation

Pour tester l'absence de régression de syntaxe JavaScript :
```bash
node -e "const fs = require('fs'); const content = fs.readFileSync('index.html', 'utf8'); const scripts = content.match(/<script[\s\S]*?<\/script>/gi); scripts.forEach((s, i) => { const code = s.replace(/<script[^>]*>|<\/script>/gi, ''); new Function(code); }); console.log('All scripts valid');"
```
