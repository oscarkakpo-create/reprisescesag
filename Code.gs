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

    // 3. Envoi automatique d'une copie récapitulative par email au demandeur
    var studentEmail = (data.contact && data.contact.email) ? String(data.contact.email).trim() : "";
    if (studentEmail && studentEmail.indexOf("@") !== -1) {
      try {
        var studentNomComplet = [
          (data.etudiant && data.etudiant.prenom) || "",
          (data.etudiant && data.etudiant.nom) || ""
        ].join(" ").trim();
        if (!studentNomComplet) studentNomComplet = "Étudiant(e)";

        var subject = "CESAG — Copie de votre demande de reprise d'études [" + (data.ref || "") + "]";

        var bodyText = "Bonjour " + studentNomComplet + ",\n\n" +
          "Nous vous confirmons la bonne réception de votre demande de reprise d'unités d'enseignement pour l'année académique 2026-2027 au CESAG.\n\n" +
          "RÉCAPITULATIF DE VOTRE DOSSIER :\n" +
          "--------------------------------------------------\n" +
          "• Référence du dossier : " + (data.ref || "") + "\n" +
          "• Date d'enregistrement : " + (data.submittedAt ? new Date(data.submittedAt).toLocaleString("fr-FR") : new Date().toLocaleString("fr-FR")) + "\n" +
          "• Programme : " + ((data.programme && data.programme.programme) || "CESAG PRO") + "\n" +
          "• Niveau / Filière : " + ((data.programme && data.programme.niveau) || "") + "\n" +
          "• Promotion : " + ((data.etudiant && data.etudiant.promo) || "") + "\n" +
          "• N° Étudiant : " + ((data.etudiant && data.etudiant.code) || "Non renseigné") + "\n" +
          "• Téléphone : " + ((data.contact && data.contact.tel) || "") + "\n\n" +
          "MATIÈRES SÉLECTIONNÉES (" + matieres.length + ") :\n" +
          matieres.map(function(m, idx) {
            var s = m.saisieLibre ? m.sem : ("Semestre " + m.sem);
            return "  " + (idx + 1) + ". " + m.nom + " (" + s + ") — " + m.h + "h — " + (m.montant || (m.h * 2500)) + " FCFA";
          }).join("\n") + "\n\n" +
          "DÉCOMPTE FINANCIER :\n" +
          "• Volume horaire total : " + ((data.totaux && data.totaux.heures) || 0) + " h\n" +
          "• Coût pédagogique (2 500 F/h) : " + ((data.totaux && data.totaux.coutPedagogique) || 0) + " FCFA\n" +
          "• Frais d'inscription forfaitaires : " + ((data.totaux && data.totaux.fraisInscription) || 0) + " FCFA\n" +
          "• TOTAL À RÉGLER : " + ((data.totaux && data.totaux.total) || 0) + " FCFA\n" +
          (data.exoneration && data.exoneration.demandee ? ("• Exonération déclarée : OUI\n  Motif : " + (data.exoneration.motif || "Sur justificatif médical ou d'inscription tardive") + "\n") : "") +
          "--------------------------------------------------\n\n" +
          "PROCHAINES ÉTAPES :\n" +
          "1. Conservez précieusement ce message électronique et votre numéro de référence.\n" +
          "2. Présentez votre Fiche d'inscription signée ainsi que votre Lettre officielle adressée à Mme le Directeur Général au secrétariat pédagogique (DPGELM).\n" +
          "3. Procédez au règlement des frais auprès de l'agence comptable du CESAG.\n\n" +
          "Pour toute question :\n" +
          "• mame.coulibaly@cesag.edu.sn\n" +
          "• isabelle.Mandiouba@cesag.edu.sn\n" +
          "• jean.agopome@cesag.edu.sn\n\n" +
          "Département DPGELM — Centre Africain d'Études Supérieures en Gestion (CESAG), Dakar";

        MailApp.sendEmail({
          to: studentEmail,
          subject: subject,
          body: bodyText
        });
      } catch (mailErr) {
        Logger.log("Erreur lors de l'envoi de la copie email: " + mailErr);
      }
    }

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
