/**
 * Periodically syncs the selected Google Sheets tab to the CRM.
 * Keep the sync token in Apps Script > Project settings > Script properties.
 */
const CRM_CONFIG = {
  endpoint: "https://YOUR-VERCEL-DOMAIN.vercel.app/api/integrations/sheets",
  tabNames: ["Marketing IA", "De 0 a Agentes"],
  rowsPerBatch: 150,
  stateTabName: "__CRM_SYNC_STATE",
};

function syncLeadsToCrm() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const secret = PropertiesService.getScriptProperties().getProperty("CRM_SYNC_SECRET");
  if (!secret)
    throw new Error("Set CRM_SYNC_SECRET in Apps Script project properties first.");
  if (CRM_CONFIG.endpoint.includes("YOUR-VERCEL-DOMAIN"))
    throw new Error("Set the deployed CRM endpoint in CRM_CONFIG.endpoint.");

  let stateSheet = spreadsheet.getSheetByName(CRM_CONFIG.stateTabName);
  if (!stateSheet) stateSheet = spreadsheet.insertSheet(CRM_CONFIG.stateTabName);
  if (!stateSheet.isSheetHidden()) stateSheet.hideSheet();
  const stateRows =
    stateSheet.getLastRow() > 1
      ? stateSheet.getRange(2, 1, stateSheet.getLastRow() - 1, 2).getValues()
      : [];
  const knownHashes = new Map(
    stateRows.map(([key, hash]) => [String(key), String(hash)]),
  );

  CRM_CONFIG.tabNames.forEach((tabName) => {
    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) throw new Error(`Sheet tab not found: ${tabName}`);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return;
    const headers = values[0].map((value) => normalizeHeader_(value));
    const find = (...names) =>
      names
        .map((name) => headers.indexOf(normalizeHeader_(name)))
        .find((index) => index >= 0) ?? -1;
    const columns = {
      date: find("FECHA"),
      phone: find("NUMERO", "NÚMERO", "TELEFONO"),
      name: find("NOMBRE", "NOMBRE 1"),
      name2: find("NOMBRE 2"),
      product: find("PRODUCTO", "PROGRAMA"),
      stage: find("ESTADO"),
      interest: find("INTERES", "INTERÉS"),
      origin: find("ORIGEN"),
      notes: find("OBSERVACIONES", "COMENTARIO", "OBSERVACIONES ANTERIORES"),
      next: find("PROXIMO CONTACTO O VISITA", "PRÓXIMO CONTACTO O VISITA"),
      amount: find("PRECIO", "MONTO", "PRECIO DEL TRATO"),
      method: find("METODO DE PAGO", "MÉTODO DE PAGO"),
      email: find("CORREO", "EMAIL"),
    };
    if (columns.phone < 0) throw new Error(`No phone column found in ${tabName}.`);

    const changedRows = new Map();
    for (let index = 1; index < values.length; index++) {
      const row = values[index];
      const phone = String(row[columns.phone] ?? "").trim();
      if (!phone) continue;
      const get = (column) => (column < 0 ? "" : row[column]);
      const name = [get(columns.name), get(columns.name2)]
        .filter(Boolean)
        .join(" ")
        .trim();
      const product = String(get(columns.product) ?? "").trim();
      const key = `${phone.replace(/\D/g, "")}:${normalizeHeader_(product)}`;
      const lead = {
        full_name: name,
        phone,
        email: String(get(columns.email) ?? ""),
        origin: String(get(columns.origin) || "Bot"),
        product,
        stage: String(get(columns.stage) ?? ""),
        interest: String(get(columns.interest) ?? ""),
        deal_amount: Number(get(columns.amount)) || 0,
        payment_method: String(get(columns.method) ?? ""),
        next_contact_at: dateValue_(get(columns.next)),
        notes: String(get(columns.notes) ?? ""),
        created_at: dateValue_(get(columns.date)),
        source_key: key,
      };
      const hash = Utilities.base64Encode(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(lead)),
      );
      const checkpointKey = `${tabName}:${key}`;
      if (knownHashes.get(checkpointKey) !== hash)
        changedRows.set(key, { lead, hash, checkpointKey });
    }

    const pending = Array.from(changedRows.values());
    for (let offset = 0; offset < pending.length; offset += CRM_CONFIG.rowsPerBatch) {
      const batch = pending.slice(offset, offset + CRM_CONFIG.rowsPerBatch);
      const response = UrlFetchApp.fetch(CRM_CONFIG.endpoint, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${secret}` },
        payload: JSON.stringify({ leads: batch.map((item) => item.lead) }),
        muteHttpExceptions: true,
      });
      if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
        throw new Error(
          `CRM sync failed (${response.getResponseCode()}): ${response.getContentText().slice(0, 300)}`,
        );
      }
      batch.forEach((item) => knownHashes.set(item.checkpointKey, item.hash));
    }
    if (pending.length) {
      const checkpoint = Array.from(knownHashes, ([key, hash]) => [key, hash]);
      stateSheet.clearContents();
      stateSheet.getRange(1, 1, 1, 2).setValues([["source_key", "content_hash"]]);
      if (checkpoint.length)
        stateSheet.getRange(2, 1, checkpoint.length, 2).setValues(checkpoint);
    }
  });
}

function createFiveMinuteTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "syncLeadsToCrm")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("syncLeadsToCrm").timeBased().everyMinutes(5).create();
}

function normalizeHeader_(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function dateValue_(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
