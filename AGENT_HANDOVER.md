# 📘 Dossier de Passation & Documentation Technique — Reprises CESAG (2026-2027)

Ce document rassemble l'intégralité du contexte, de l'architecture, des choix techniques, des fonctionnalités implémentées et des consignes opérationnelles pour permettre à tout agent ou développeur de reprendre immédiatement le projet sans rupture.

---

## 1. Contexte & Objectifs du Projet

L'application web **Reprises CESAG** est une plateforme autonome conçue pour le **CESAG** (*Centre Africain d'Études Supérieures en Gestion*, Dakar) et son département **DPGELM**. 

Elle permet aux étudiants inscrits en reprise de modules de :
1. Sélectionner leur programme et niveau de formation.
2. Composer leur panier d'Unités d'Enseignement (UE) / matières à reprendre (calcul automatique des volumes horaires et des frais de scolarité).
3. Déclarer une éventuelle exonération (sur justificatif médical ou d'inscription tardive) avec upload de pièce jointe intégrée directement en annexe.
4. Signer numériquement au doigt ou à la souris sur écran tactile.
5. Transmettre automatiquement leur dossier à la base de données centrale (**Google Sheets via Google Apps Script**).
6. Générer et imprimer deux documents officiels en haute fidélité vectorielle :
   - **La Fiche d'inscription pédagogique aux reprises** (avec QR Code de vérification et annexe justificative).
   - **La Lettre officielle de demande adressée à Mme le Directeur Général du CESAG** (exigée par le service courrier).

---

## 2. Environnement de Travail & Dépôt Git

- **Dépôt distant GitHub :** `https://github.com/oscarkakpo-create/reprisescesag.git`
- **Branche principale de production :** `main`
- **Répertoire local :** `C:\Users\Digi Face\.gemini\antigravity\scratch\reprisescesag`
- **Structure des fichiers clés :**
  - [index.html](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/index.html) : Application complète (Single-Page Application HTML5/CSS3/Vanilla JS autonome sans dépendance externe bloquante).
  - [Code.gs](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/Code.gs) : Script serveur Google Apps Script lié au Google Sheet de collecte.
  - [logo-cesag.jpg](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/logo-cesag.jpg) : Logo officiel CESAG (également injecté en Base64 dans `index.html` pour garantir le rendu hors-ligne).
  - [AGENT_HANDOVER.md](file:///C:/Users/Digi%20Face/.gemini/antigravity/scratch/reprisescesag/AGENT_HANDOVER.md) : Copie versionnée de ce document au sein du dépôt.

---

## 3. Nomenclature & Règles Métier Validées

### 3.1. Structure des Programmes et Filières
- **Programme officiel :** Remplacé par `CESAG PRO` (anciennement désigné `LPSG`).
- **Parallélisme des formes pour les Licences :**
  - **LG** = *Licence en Gestion*
  - **LCCA** = *Licence en Comptabilité, Contrôle et Audit* (option autonome, non couplée).
- **Liste complète des 8 niveaux configurés dans `window.PROGRAMS` :**
  1. `LG 1 — Licence en Gestion` (id: `lg1`)
  2. `LG 2 — Licence en Gestion` (id: `lg2`)
  3. `LG 3 — Entrepreneuriat et Gestion des Projets (EGP)` (id: `lg3_egp`)
  4. `LG 3 — Techniques Comptables et Financières (LTCF)` (id: `lg3_ltcf`)
  5. `LG 3 — Techniques Bancaires et Financières (TBF)` (id: `lg3_tbf`)
  6. `LCCA 1 — Licence en Comptabilité, Contrôle et Audit` (id: `lcca1`)
  7. `LCCA 2 — Licence en Comptabilité, Contrôle et Audit` (id: `lcca2`)
  8. `LCCA 3 — Comptabilité, Contrôle et Audit` (id: `lcca3`) — *Sans mention de classe A, B ou C conformément aux consignes*.

### 3.2. Grille Tarifaire
- **Coût pédagogique horaire :** `2 500 FCFA` par heure d'enseignement.
- **Frais de dossier / inscription forfaitaires :** `25 000 FCFA`.
- **Formule de calcul :**
  $$\text{Total à payer} = (\text{Volume horaire total} \times 2\,500) + 25\,000 \text{ FCFA}$$
- **Option d'exonération :** Formule exacte retenue : *« Je bénéficie d'une exonération (totale ou partielle) de ces frais — maladie ou inscription tardive, sur justificatif »*.

### 3.3. Promotion de l'étudiant
- Menu déroulant proposant :
  - `2023-2024`
  - `2024-2025`
  - `2025-2026`
  - `2026-2027`
  - `Autre…`
- Si `Autre…` est choisi, un champ texte apparaît avec validation et auto-formatage strict de la casse sous la forme `AAAA-AAAA` (ex: `2022-2023`).

### 3.4. Contacts Officiels & Destinataires
- **Secrétariat DPGELM :**
  - `mame.coulibaly@cesag.edu.sn`
  - `isabelle.Mandiouba@cesag.edu.sn`
  - `jean.agopome@cesag.edu.sn`
- **Destinataire courrier de la lettre officielle :**
  - *À Madame le Directeur Général du CESAG*

---

## 4. Architecture Technique & Fonctionnalités Clés

### 4.1. Mémorisation Automatique & Sauvegarde Hors-Ligne (Crash Recovery)
- Implémenté via `localStorage` sous la clé `reprise_cesag_draft_v1`.
- Les saisies de l'étudiant (nom, prénom, code, contact, promotion, matières sélectionnées, motif d'exonération) sont synchronisées à chaque frappe (`saveDraft()`).
- En cas de fermeture inopinée, coupure réseau ou rechargement de page, les informations sont restaurées instantanément sans perte (`restoreDraft()`).

### 4.2. Signature Tactile au Doigt ou à la Souris (`sigCanvas`)
- **Problème résolu :** Le canvas de signature affichait parfois des dimensions 0×0 px ou un décalage tactile lorsque le formulaire était initialement masqué (`display: none` / `hidden`).
- **Solution pérenne :** Fonction `syncSignatureCanvas()` qui recalcule la surface de dessin dès que le formulaire devient visible, au premier contact tactile (`pointerdown` / `touchstart`) et lors du redimensionnement de la fenêtre.
- Affichage d'un badge visuel `✓ Signature enregistrée`.

### 4.3. Navigation & Synchronisation Dynamique de la Barre d'Adresse
- Implémentation de `setViewAddress(hash, title)` et gestion de l'événement `popstate`.
- L'URL de la barre d'adresse change dynamiquement et proprement selon l'étape active :
  - `#accueil` (ou `#programme`)
  - `#formulaire`
  - `#dossier`
  - `#dossier-fiche`
  - `#dossier-lettre-dg`
- La navigation par les flèches Précédent/Suivant du navigateur est supportée.

### 4.4. Double Document Officiel & Impression Vectorielle Sans Coupure
- **Contrainte ergonomique :** Maximum **deux boutons d'action** sur l'écran d'export final.
  1. **Bouton principal (Rouge pâle animé) :** `🖨️ Imprimer / PDF (Les 2 pièces ensemble)` (`#print-both-btn`).
  2. **Bouton secondaire :** `📄 Imprimer / PDF (La pièce affichée uniquement)` (`#print-single-btn`).
- **Moteur d'impression `@media print` :**
  - Évite les coupures de texte et flous inhérents à `html2canvas` / `html2pdf.js`.
  - Lors de l'impression conjointe (`.print-both-mode`), la fiche s'imprime en Page 1 (avec annexe en Page 2 si justificatif fourni), suivie d'un saut de page strict (`page-break-after: always`), puis de la Lettre officielle à Mme le Directeur Général sur la page suivante.
  - Résultat 100% vectoriel, typographie nette, prêt pour "Enregistrer au format PDF" ou impression papier.

### 4.5. Réinitialisation Complète & Retour à la Landing Page
- Fonction `returnToLandingPage()` déclenchée par le bouton `🏠 Terminer et retourner à la page d'accueil` (`#restart-btn`).
- **Actions exécutées :**
  - Purge du `localStorage` (protection des données personnelles sur ordinateur partagé).
  - Réinitialisation complète du formulaire et du canvas de signature.
  - Vidage des documents générés.
  - Masquage des sections formulaire et résultat.
  - Remise à zéro des sélecteurs de programme.
  - Défilement fluide vers le haut (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
  - URL réinitialisée sur `#accueil`.
  - Toast de confirmation : `✓ Session terminée — Retour à la page d'accueil`.

### 4.6. Backend Google Apps Script (`Code.gs`)
- **Google Sheet cible :** ID `1tjgolQprcPfvmkJbS1kUbuheEwJCWc_qy9WsA8STSpw`
- **Webhook WebApp :** `https://script.google.com/macros/s/AKfycbzOUJglQOsxRlDs0ysZJWuQQXrumfTiGU1znHO2eWUsdUv3PGa8n6V5BotBquBo1OBoYQ/exec`
- **Fonctionnalités :**
  - Verrouillage transactionnel (`LockService`).
  - Onglet `Demandes` : 1 ligne par étudiant (avec référence unique anti-doublon).
  - Onglet `Détail Matières` : ventilation détaillée matière par matière pour le suivi pédagogique.
  - Mode hors-ligne pris en charge côté client avec file d'attente synchronisée au retour de connexion.

---

## 5. Modèle de Mail Administratif (Transmission)

Conformément à la demande de synthèse (3 paragraphes maximum), voici le modèle standard validé pour accompagner l'envoi des dossiers :

```text
Objet : Transmission du dossier de reprise d'études — [Nom] [Prénom] — [Classe/Filière] — Promotion [Année]

Madame, Monsieur du Secrétariat Pédagogique (DPGELM),

Je vous transmets par la présente mon dossier complet de reprise d'unités d'enseignement pour l'année académique 2026-2027 au titre de la filière [Classe/Filière]. Vous trouverez en pièces jointes ma fiche d'inscription détaillée récapitulant les matières concernées ainsi que ma lettre officielle de demande.

Le montant total des frais s'élève à [Montant] FCFA ([Total Heures] heures de cours + 25 000 FCFA de frais d'inscription). [Si applicable : Je vous joins également le justificatif relatif à ma demande d'exonération pour examen de ma situation.]

Restant à votre entière disposition pour tout complément d'information ou pour la validation de mon paiement auprès de l'agence comptable, je vous prie d'agréer l'expression de mes salutations distinguées.

[Nom Prénom]
Code Étudiant : [Code]
Téléphone : [Numéro]
Email : [Email]
```

---

## 6. Historique Récent des Commits Git

| Commit | Description |
|---|---|
| `1135e91` | `feat: ajout du retour landing page et reinitialisation complete` |
| `779a5fa` | `feat: 2 boutons max (Imprimer/PDF ensemble vs unique), mise a jour URL barre d'adresse et fiabilisation de la signature au doigt` |
| `f89690a` | `fix(pdf): resolution des coupures d export et ajout de la signature tactile au doigt/souris` |
| `8893a69` | `feat: ajout du modèle de lettre officielle au DG pour le service courrier avec export PDF, impression directe et bouton rouge pâle animé` |
| `0764c64` | `CESAG PRO (LG et LCCA separes) + menu Promotion avec formatage de casse + memorisation auto du brouillon` |
| `7f9d7db` | `Ajout import justificatif d'exoneration (annexe PDF page 2) + bouton transmission email au secretariat` |
| `4a9c19d` | `Integration du logo officiel du CESAG sur l'interface et la fiche PDF` |
| `7824207` | `Ajout des contacts officiels du secretariat DPGELM sur la fiche et l'interface` |

---

## 7. Guide & Règles pour le Prochain Agent

1. **Validation JavaScript systématique avant tout commit :**
   Toujours vérifier qu'aucun bloc `<script>` ne présente d'erreur de syntaxe en exécutant :
   ```bash
   node -e "const fs = require('fs'); const content = fs.readFileSync('index.html', 'utf8'); const scripts = content.match(/<script[\s\S]*?<\/script>/gi); scripts.forEach((s, i) => { const code = s.replace(/<script[^>]*>|<\/script>/gi, ''); new Function(code); }); console.log('All scripts valid');"
   ```
2. **Ne jamais ajouter plus de deux boutons d'action sur l'écran d'export :**
   La consigne utilisateur est stricte : maximum 2 boutons d'action d'impression (`#print-both-btn` et `#print-single-btn`), plus le bouton discret de retour à la page d'accueil (`#restart-btn`).
3. **Privilégier l'impression native du navigateur (`window.print()`) :**
   Ne pas réintroduire d'exports canvas rasterisés lourds (`html2canvas`) qui provoquent des coupures de lignes sur les grands tableaux de matières.
4. **Conservation de l'architecture Single-File :**
   `index.html` doit rester totalement autonome (CSS inliné, assets critiques en Base64) afin de fonctionner aussi bien en local via double-clic (`file://`) que servi sur GitHub Pages ou un serveur interne du CESAG.
