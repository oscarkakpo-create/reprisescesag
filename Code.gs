/**
 * Google Apps Script — Réception des demandes de reprise CESAG (2026-2027)
 * Lié au Google Sheet : https://docs.google.com/spreadsheets/d/1tjgolQprcPfvmkJbS1kUbuheEwJCWc_qy9WsA8STSpw/edit
 *
 * Instructions de déploiement :
 * 1. Ouvrir le Google Sheet > menu Extensions > Apps Script.
 * 2. Coller l'intégralité de ce fichier dans Code.gs et enregistrer (Ctrl+S).
 * 3. Cliquer sur Déployer (en haut à droite) > Nouveau déploiement.
 * 4. Choisir le type "Application Web" (icône engrenage) :
 *    - Exécuter en tant que : Moi
 *    - Qui peut accéder : Tout le monde
 * 5. Cliquer sur Déployer, autoriser l'accès, puis copier l'URL (.../exec).
 * 6. Coller cette URL dans index.html dans window.REPRISE_CONFIG.ENDPOINT_URL.
 */

var SPREADSHEET_ID = "1tjgolQprcPfvmkJbS1kUbuheEwJCWc_qy9WsA8STSpw";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Empty payload" });
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SPREADSHEET_ID
      ? SpreadsheetApp.openById(SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();

    // 1. Onglet "Demandes" (1 ligne par demande étudiant)
    var sheetDemandes = ss.getSheetByName("Demandes") || ss.insertSheet("Demandes");
    if (sheetDemandes.getLastRow() === 0) {
      sheetDemandes.appendRow([
        "Référence",
        "Date de soumission",
        "Programme",
        "Niveau",
        "Code Étudiant",
        "Nom",
        "Prénom",
        "Promo",
        "Email",
        "Téléphone",
        "Nb Matières",
        "Détail Matières",
        "Total Heures",
        "Coût Pédagogique (FCFA)",
        "Frais Inscription (FCFA)",
        "Total à régler (FCFA)",
        "Exonération demandée",
        "Motif Exonération"
      ]);
    }

    // Anti-doublon par référence (comme le site peut réessayer la file d'attente hors-ligne)
    var lastRow = sheetDemandes.getLastRow();
    if (lastRow > 1 && data.ref) {
      var refs = sheetDemandes.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < refs.length; i++) {
        if (String(refs[i][0]) === String(data.ref)) {
          return jsonResponse({ status: "duplicate", ref: data.ref });
        }
      }
    }

    var matieres = data.matieres || [];
    var matieresResume = matieres.map(function(m) {
      var semLabel = m.saisieLibre ? m.sem : ("S" + m.sem);
      return "[" + semLabel + "] " + m.nom + " (" + m.h + "h)";
    }).join(" | ");

    sheetDemandes.appendRow([
      data.ref || "",
      data.submittedAt || new Date().toISOString(),
      (data.programme && data.programme.programme) || "",
      (data.programme && data.programme.niveau) || "",
      (data.etudiant && data.etudiant.code) || "",
      (data.etudiant && data.etudiant.nom) || "",
      (data.etudiant && data.etudiant.prenom) || "",
      (data.etudiant && data.etudiant.promo) || "",
      (data.contact && data.contact.email) || "",
      (data.contact && data.contact.tel) || "",
      matieres.length,
      matieresResume,
      (data.totaux && data.totaux.heures) || 0,
      (data.totaux && data.totaux.coutPedagogique) || 0,
      (data.totaux && data.totaux.fraisInscription) || 0,
      (data.totaux && data.totaux.total) || 0,
      data.exoneration && data.exoneration.demandee ? "OUI" : "NON",
      (data.exoneration && data.exoneration.motif) || ""
    ]);

    // 2. Onglet "Detail_Matieres" (1 ligne par matière cochée, idéal pour compter les inscrits par cours)
    var sheetMatieres = ss.getSheetByName("Detail_Matieres") || ss.insertSheet("Detail_Matieres");
    if (sheetMatieres.getLastRow() === 0) {
      sheetMatieres.appendRow([
        "Référence",
        "Date de soumission",
        "Niveau",
        "Code Étudiant",
        "Nom",
        "Prénom",
        "Semestre",
        "Matière",
        "Volume (h)",
        "Montant (FCFA)",
        "Saisie libre"
      ]);
    }

    matieres.forEach(function(m) {
      sheetMatieres.appendRow([
        data.ref || "",
        data.submittedAt || "",
        (data.programme && data.programme.niveau) || "",
        (data.etudiant && data.etudiant.code) || "",
        (data.etudiant && data.etudiant.nom) || "",
        (data.etudiant && data.etudiant.prenom) || "",
        m.sem,
        m.nom,
        m.h,
        m.montant,
        m.saisieLibre ? "OUI" : "NON"
      ]);
    });

    return jsonResponse({ status: "ok", ref: data.ref });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse({
    status: "online",
    service: "Reprises CESAG — 2026-2027",
    spreadsheetId: SPREADSHEET_ID
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
