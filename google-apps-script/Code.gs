/**
 * Evet Kofte POS — Google Apps Script backend
 * -------------------------------------------------------------
 * What this does:
 *   The tablet app POSTs a base64-encoded .xlsx report here whenever a
 *   session ends (or an admin generates a custom report). This script:
 *     1. Saves the file into a "Evet Kofte Reports" folder in the Google
 *        Drive of whichever Google account deploys this script.
 *     2. Emails the file (with a Drive link) to the address configured
 *        in the tablet app's Admin > Settings screen.
 *
 * SETUP (about 5 minutes):
 *   1. Go to https://script.google.com and click "New project".
 *   2. Delete the placeholder code and paste in this entire file.
 *   3. Click Deploy > New deployment.
 *      - Select type: "Web app"
 *      - Execute as: "Me"
 *      - Who has access: "Anyone"
 *   4. Click Deploy, authorize the permissions it asks for (Drive + Gmail).
 *   5. Copy the Web App URL it gives you (ends in /exec).
 *   6. On the tablet: Admin > Settings > "Google Apps Script Web App URL"
 *      — paste it there, add your notification email, and Save.
 *
 * That's it — reports will now auto-save to Drive and auto-email.
 * -------------------------------------------------------------
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var fileName = data.fileName || ("Evet-Kofte-Report_" + new Date().toISOString() + ".xlsx");
    var base64 = data.fileData;
    var emailTo = data.email || "";
    var subject = data.subject || fileName;
    var body = data.body || "Attached is the latest Evet Kofte sales & expense report.";

    if (!base64) throw new Error("No file data received.");

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName
    );

    var folder = getOrCreateFolder("Evet Kofte Reports");
    var file = folder.createFile(blob);

    var emailed = false;
    if (emailTo) {
      MailApp.sendEmail({
        to: emailTo,
        subject: subject,
        body: body + "\n\nDrive link: " + file.getUrl(),
        attachments: [blob]
      });
      emailed = true;
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, url: file.getUrl(), emailed: emailed }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

// Lets you sanity-check the deployment by visiting the Web App URL directly.
function doGet() {
  return ContentService.createTextOutput("Evet Kofte POS report endpoint is running.");
}
