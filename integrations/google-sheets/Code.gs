/**
 * Importa cambios de Google Sheets al CRM en lotes seguros y reintentables.
 * Configura endpoint, pestañas y encabezados antes de instalar el activador.
 */
const CRM_CONFIG = {
  endpoint: "https://YOUR-VERCEL-DOMAIN.vercel.app/api/integrations/sheets",
  tabNames: ["Marketing IA", "De 0 a Agentes"],
  rowsPerBatch: 100,
  maxRunMs: 4 * 60 * 1000 + 30 * 1000,
  stateTabName: "__CRM_SYNC_STATE",
  errorsTabName: "__CRM_SYNC_ERRORS",
  maxRetries: 4,
  // El mapeo busca estos nombres normalizados, sin depender del orden de columnas.
  columnMap: {
    date: ["FECHA", "TIMESTAMP", "FECHA DE INGRESO"],
    phone: ["TELEFONO", "NUMERO", "WHATSAPP"],
    name: ["NOMBRE", "NOMBRE 1", "NOMBRES"],
    name2: ["NOMBRE 2", "APELLIDO"],
    product: ["PRODUCTO", "PROGRAMA", "CURSO"],
    stage: ["ESTADO", "ETAPA"],
    interest: ["INTERES", "NIVEL DE INTERES"],
    origin: ["ORIGEN", "FUENTE"],
    notes: ["OBSERVACIONES", "COMENTARIO", "NOTAS"],
    next: ["PROXIMO CONTACTO O VISITA", "PROXIMO CONTACTO", "PROXIMA TAREA"],
    amount: ["PRECIO", "MONTO", "PRECIO DEL TRATO"],
    method: ["METODO DE PAGO", "FORMA DE PAGO"],
    email: ["CORREO", "EMAIL", "E-MAIL"],
  },
};

function syncLeadsToCrm() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  const startedAt = Date.now();
  try {
    syncLocked_(startedAt);
  } catch (error) {
    writeError_({ tab: "", row: "", sourceKey: "", message: error.message });
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function syncLocked_(startedAt) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const secret = PropertiesService.getScriptProperties().getProperty("CRM_SYNC_SECRET");
  if (!secret) throw new Error("Define CRM_SYNC_SECRET en Script properties.");
  if (CRM_CONFIG.endpoint.includes("YOUR-VERCEL-DOMAIN"))
    throw new Error("Configura CRM_CONFIG.endpoint con el dominio del CRM.");

  const stateSheet = getOrCreateSheet_(spreadsheet, CRM_CONFIG.stateTabName, [
    "checkpoint",
    "content_hash",
  ]);
  stateSheet.hideSheet();
  const errorsSheet = getOrCreateSheet_(spreadsheet, CRM_CONFIG.errorsTabName, [
    "timestamp",
    "tab",
    "row",
    "source_key",
    "message",
  ]);
  errorsSheet.hideSheet();
  const knownHashes = readState_(stateSheet);

  for (const tabName of CRM_CONFIG.tabNames) {
    if (Date.now() - startedAt >= CRM_CONFIG.maxRunMs) break;
    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) {
      writeError_({
        tab: tabName,
        row: "",
        sourceKey: "",
        message: "No se encontró la pestaña.",
      });
      continue;
    }
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) continue;
    const headers = values[0].map(normalizeHeader_);
    const columns = mapColumns_(headers, tabName);
    const pending = [];

    for (let index = 1; index < values.length; index++) {
      const row = values[index];
      const phone = String(row[columns.phone] ?? "").trim();
      if (!phone) continue;
      const get = (name) => (columns[name] < 0 ? "" : row[columns[name]]);
      const name = [get("name"), get("name2")].filter(Boolean).join(" ").trim();
      const product = String(get("product") ?? "").trim();
      const sourceKey = `${phone.replace(/\D/g, "")}:${normalizeHeader_(product)}`;
      const lead = {
        full_name: name,
        phone,
        email: String(get("email") ?? "").trim(),
        origin: String(get("origin") || "Bot").trim(),
        product,
        stage: String(get("stage") ?? "").trim(),
        interest: String(get("interest") ?? "").trim(),
        deal_amount: Number(get("amount")) || 0,
        payment_method: String(get("method") ?? "").trim(),
        next_contact_at: dateValue_(get("next")),
        notes: String(get("notes") ?? "").trim(),
        created_at: dateValue_(get("date")),
        source_key: sourceKey,
        source_tab: tabName,
        source_row: index + 1,
      };
      const hash = hash_(lead);
      const checkpoint = `${tabName}:${sourceKey}`;
      if (knownHashes.get(checkpoint) !== hash)
        pending.push({ lead, hash, checkpoint, sourceKey, rowNumber: index + 1 });
    }

    for (let offset = 0; offset < pending.length; offset += CRM_CONFIG.rowsPerBatch) {
      if (Date.now() - startedAt >= CRM_CONFIG.maxRunMs) return;
      const batch = pending.slice(offset, offset + CRM_CONFIG.rowsPerBatch);
      const result = postBatch_(batch, secret);
      for (const item of batch) {
        const rowResult = result.results?.find(
          (entry) => entry.source_key === item.sourceKey,
        );
        if (rowResult && rowResult.status !== "error") {
          knownHashes.set(item.checkpoint, item.hash);
          if (rowResult.status === "conflict")
            writeError_({
              tab: tabName,
              row: item.rowNumber,
              sourceKey: item.sourceKey,
              message: rowResult.message,
            });
        } else {
          writeError_({
            tab: tabName,
            row: item.rowNumber,
            sourceKey: item.sourceKey,
            message:
              rowResult?.message || "El servidor no devolvió resultado para la fila.",
          });
        }
      }
      writeState_(stateSheet, knownHashes);
    }
  }
}

function mapColumns_(headers, tabName) {
  const columns = {};
  Object.entries(CRM_CONFIG.columnMap).forEach(([field, aliases]) => {
    columns[field] =
      aliases
        .map((alias) => headers.indexOf(normalizeHeader_(alias)))
        .find((index) => index >= 0) ?? -1;
  });
  if (columns.phone < 0)
    throw new Error(`Falta mapear la columna de teléfono en ${tabName}.`);
  if (columns.name < 0)
    throw new Error(`Falta mapear la columna de nombre en ${tabName}.`);
  return columns;
}

function postBatch_(batch, secret) {
  let lastError = "Error de red desconocido.";
  for (let attempt = 0; attempt < CRM_CONFIG.maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(CRM_CONFIG.endpoint, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${secret}` },
        payload: JSON.stringify({ leads: batch.map((item) => item.lead) }),
        muteHttpExceptions: true,
      });
      const code = response.getResponseCode();
      if (code >= 200 && code < 300) return JSON.parse(response.getContentText());
      lastError = `HTTP ${code}: ${response.getContentText().slice(0, 300)}`;
      if (code < 500 && code !== 429) break;
    } catch (error) {
      lastError = error.message;
    }
    Utilities.sleep(Math.min(1000 * Math.pow(2, attempt), 8000));
  }
  batch.forEach((item) =>
    writeError_({
      tab: item.lead.source_tab,
      row: item.rowNumber,
      sourceKey: item.sourceKey,
      message: lastError,
    }),
  );
  return {
    results: batch.map((item) => ({
      source_key: item.sourceKey,
      status: "error",
      message: lastError,
    })),
  };
}

function readState_(sheet) {
  if (sheet.getLastRow() < 2) return new Map();
  return new Map(
    sheet
      .getRange(2, 1, sheet.getLastRow() - 1, 2)
      .getValues()
      .map(([key, hash]) => [String(key), String(hash)]),
  );
}

function writeState_(sheet, state) {
  const rows = Array.from(state, ([key, hash]) => [key, hash]);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([["checkpoint", "content_hash"]]);
  if (rows.length) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function getOrCreateSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function writeError_(entry) {
  const sheet = getOrCreateSheet_(
    SpreadsheetApp.getActiveSpreadsheet(),
    CRM_CONFIG.errorsTabName,
    ["timestamp", "tab", "row", "source_key", "message"],
  );
  sheet.appendRow([new Date(), entry.tab, entry.row, entry.sourceKey, entry.message]);
  const excess = sheet.getLastRow() - 501;
  if (excess > 0) sheet.deleteRows(2, excess);
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
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hash_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(value),
  );
  return Utilities.base64Encode(bytes);
}

function dateValue_(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
