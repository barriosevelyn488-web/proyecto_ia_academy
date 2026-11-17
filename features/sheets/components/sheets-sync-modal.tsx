"use client";

import { useId, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Clipboard,
  FileSpreadsheet,
  Link as LinkIcon,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import { Lead, STAGES, stageLabel } from "@/lib/types";
import { adaptSheetLead, RawSheetLead } from "@/lib/adapters/google-sheets.adapter";
import { normalizePhoneE164 } from "@/lib/domain/phone";

type SheetsSyncModalProps = {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onImportBatch: (newLeads: Partial<Lead>[]) => Promise<{ count: number }>;
  onNotify: (msg: string) => void;
};

export function SheetsSyncModal({
  isOpen,
  onClose,
  leads,
  onImportBatch,
  onNotify,
}: SheetsSyncModalProps) {
  const pasteAreaId = useId();
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<"paste" | "file" | "export" | "script">("paste");
  const [pastedText, setPastedText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Partial<Lead>[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Parsea texto copiado directamente desde Google Sheets (separado por tabulaciones \t) o CSV
  const handleParsePasted = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      setParsedPreview([]);
      return;
    }

    // Detectar si la primera línea es encabezado
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes("numero") ||
      firstLineLower.includes("nombre") ||
      firstLineLower.includes("origen") ||
      firstLineLower.includes("fecha") ||
      firstLineLower.includes("estado");

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed: Partial<Lead>[] = [];

    for (const line of dataLines) {
      // Split by tab (Google Sheets copy) or comma
      const separator = line.includes("\t") ? "\t" : ",";
      const cols = line.split(separator).map((c) => c.replace(/^["']|["']$/g, "").trim());

      if (cols.length < 2) continue;

      // Según el orden de columnas de su Google Sheet:
      // Col A (0): FECHA
      // Col B (1): NUMERO
      // Col C (2): NOMBRE
      // Col D (3): ORIGEN
      // Col E (4): PRODUCTO
      // Col F (5): ESTADO (FLUJO DE CIERRE)
      // Col G (6): PRIORIDAD
      // Col H (7): ACUERDO
      // Col I (8): GESTION DE PAGO
      // Col J (9): NIT
      // Col K (10): MONTO
      // Col L (11): COMENTARIO

      const raw: RawSheetLead = {
        created_at: cols[0] || "",
        phone: cols[1] || "",
        full_name: cols[2] || "Sin nombre",
        origin: cols[3] || "BOT",
        product: cols[4] || "CODE UP",
        stage: cols[5] || "nuevo",
        priority: cols[6] || "SEGUIMIENTO",
        agreement: cols[7] || "",
        payment_status: cols[8] || "",
        nit: cols[9] || "",
        deal_amount: Number(cols[10]?.replace(/[^\d.]/g, "")) || 0,
        notes: cols[11] || "",
      };

      const adapted = adaptSheetLead(raw);
      if (adapted.phone) {
        parsed.push({
          full_name: adapted.full_name,
          phone: adapted.phone,
          email: adapted.email,
          origin: adapted.origin,
          product: adapted.product,
          stage: adapted.stage,
          interest: adapted.interest,
          priority: adapted.priority,
          agreement: adapted.agreement,
          payment_status: adapted.payment_status,
          deal_amount: adapted.deal_amount,
          payment_method: adapted.payment_method,
          next_contact_at: adapted.next_contact_at || "",
          notes: adapted.notes,
          nit: adapted.nit,
          source_key: adapted.source_key,
          created_at: adapted.created_at || new Date().toISOString(),
        });
      }
    }

    setParsedPreview(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result ?? "");
      handleParsePasted(content);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!parsedPreview.length) {
      onNotify("No hay contactos válidos con número de teléfono para importar.");
      return;
    }
    setBusy(true);
    try {
      const res = await onImportBatch(parsedPreview);
      onNotify(`¡Éxito! Se importaron / actualizaron ${res.count} contactos en el CRM.`);
      setPastedText("");
      setParsedPreview([]);
      onClose();
    } catch {
      onNotify("Error al importar registros. Verifica tu conexión.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "FECHA",
      "NUMERO",
      "NOMBRE",
      "ORIGEN",
      "PRODUCTO",
      "ESTADO (FLUJO DE CIERRE)",
      "PRIORIDAD",
      "ACUERDO",
      "GESTION DE PAGO",
      "NIT",
      "MONTO",
      "COMENTARIO",
    ];

    const rows = leads.map((l) => [
      l.created_at ? l.created_at.slice(0, 10) : "",
      l.phone || "",
      l.full_name || "",
      l.origin || "",
      l.product || "",
      stageLabel(l.stage),
      l.priority || "",
      l.agreement || "",
      l.payment_status || "",
      l.nit || "",
      l.deal_amount || 0,
      (l.notes || "").replace(/[\r\n]+/g, " "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((val) => `"${String(val ?? "").replaceAll('"', '""')}"`).join(","),
      ),
    ].join("\r\n");

    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campuslands_crm_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify("Archivo CSV descargado con éxito.");
  };

  const copyToClipboard = () => {
    const headers = [
      "FECHA",
      "NUMERO",
      "NOMBRE",
      "ORIGEN",
      "PRODUCTO",
      "ESTADO",
      "PRIORIDAD",
      "ACUERDO",
      "GESTION DE PAGO",
      "NIT",
      "MONTO",
      "COMENTARIO",
    ];

    const rows = leads.map((l) => [
      l.created_at ? l.created_at.slice(0, 10) : "",
      l.phone || "",
      l.full_name || "",
      l.origin || "",
      l.product || "",
      stageLabel(l.stage),
      l.priority || "",
      l.agreement || "",
      l.payment_status || "",
      l.nit || "",
      l.deal_amount || 0,
      (l.notes || "").replace(/[\r\n]+/g, " "),
    ]);

    const tsvContent = [
      headers.join("\t"),
      ...rows.map((r) => r.map((c) => String(c ?? "")).join("\t")),
    ].join("\n");

    void navigator.clipboard.writeText(tsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onNotify("Copiado al portapapeles. Pégalo directamente en Google Sheets con Ctrl+V.");
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 840, maxHeight: "90vh" }}>
        <div className="modal-head">
          <div>
            <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={18} style={{ color: "#16a34a" }} />
              Centro de Importación y Exportación Google Sheets
            </div>
            <div className="modal-sub">
              Sincroniza tus contactos fácilmente entre Google Sheets, Excel y el CRM sin errores ni duplicados.
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Pestañas superiores */}
        <div style={{ display: "flex", gap: 8, padding: "0 24px", borderBottom: "1px solid var(--border)" }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === "paste" ? "active" : ""}`}
            onClick={() => setActiveTab("paste")}
          >
            <Clipboard size={14} /> Pegar desde Sheets
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
            onClick={() => setActiveTab("file")}
          >
            <Upload size={14} /> Subir archivo CSV
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "export" ? "active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            <ArrowDownToLine size={14} /> Exportar
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "script" ? "active" : ""}`}
            onClick={() => setActiveTab("script")}
          >
            <LinkIcon size={14} /> Auto-sincronización
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", maxHeight: "60vh", padding: 24 }}>
          {activeTab === "paste" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 8, fontSize: 13, color: "#166534" }}>
                <strong>💡 ¿Cómo funciona?</strong>
                <ol style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  <li>Abre tu Google Sheets (hoja <em>Seguimiento!</em>).</li>
                  <li>Selecciona las filas que deseas traer (con o sin encabezados).</li>
                  <li>Presiona <code>Ctrl + C</code> para copiar.</li>
                  <li>Haz clic abajo y presiona <code>Ctrl + V</code> para pegar. ¡El sistema detectará todas las columnas automáticamente!</li>
                </ol>
              </div>

              <div>
                <label
                  htmlFor={pasteAreaId}
                  style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}
                >
                  Pega las celdas aquí:
                </label>
                <textarea
                  id={pasteAreaId}
                  className="field"
                  rows={6}
                  placeholder="Pega aquí el contenido copiado de Google Sheets..."
                  value={pastedText}
                  onChange={(e) => handleParsePasted(e.target.value)}
                  style={{ fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                />
              </div>

              {parsedPreview.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      Vista previa detectada: <strong>{parsedPreview.length}</strong> contactos válidos
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      Los teléfonos repetidos se actualizarán automáticamente sin duplicarse.
                    </span>
                  </div>

                  <div className="table-wrap" style={{ maxHeight: 220, overflowY: "auto" }}>
                    <table className="table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Nombre</th>
                          <th>Origen</th>
                          <th>Producto</th>
                          <th>Etapa</th>
                          <th>Prioridad</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.phone}</strong></td>
                            <td>{item.full_name}</td>
                            <td>{item.origin}</td>
                            <td>{item.product}</td>
                            <td>{stageLabel(item.stage || "nuevo")}</td>
                            <td>{item.priority || "SEGUIMIENTO"}</td>
                            <td>Q{item.deal_amount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedPreview.length > 10 && (
                    <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      ... y {parsedPreview.length - 10} contactos más listos para importar.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "file" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "40px 20px", textAlign: "center", background: "var(--bg-subtle)" }}>
                <Upload size={32} style={{ color: "var(--brand)", marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Sube tu archivo .CSV exportado de Google Sheets
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                  (Archivo ➔ Descargar ➔ Valores separados por comas .csv)
                </div>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <label htmlFor={fileInputId} className="button primary" style={{ cursor: "pointer" }}>
                  Seleccionar archivo CSV
                </label>
              </div>

              {parsedPreview.length > 0 && (
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                  ✅ Archivo leído con éxito: {parsedPreview.length} contactos detectados listos para importar.
                </div>
              )}
            </div>
          )}

          {activeTab === "export" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 13, color: "var(--ink)" }}>
                Exporta toda tu base de datos de <strong>{leads.length} contactos</strong> con las 12 columnas exactas de tu Google Sheets (Fecha, Número, Nombre, Origen, Producto, Flujo de Cierre, Prioridad, Acuerdo, Gestión de Pago, NIT, Monto, Comentario).
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, textAlign: "center" }}>
                  <FileSpreadsheet size={30} style={{ color: "#16a34a", marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Descargar CSV</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                    Compatible con Google Sheets, Excel y LibreOffice con tildes y caracteres de Guatemala.
                  </div>
                  <button type="button" className="button primary" style={{ width: "100%" }} onClick={exportCsv}>
                    <ArrowDownToLine size={14} /> Descargar .CSV
                  </button>
                </div>

                <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, textAlign: "center" }}>
                  <Clipboard size={30} style={{ color: "#3b82f6", marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Copiar al Portapapeles</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                    Copia la tabla formateada para abrir tu Google Sheets y presionar <code>Ctrl+V</code>.
                  </div>
                  <button type="button" className="button" style={{ width: "100%" }} onClick={copyToClipboard}>
                    {copied ? <Check size={14} style={{ color: "#16a34a" }} /> : <Clipboard size={14} />}
                    {copied ? "¡Copiado con éxito!" : "Copiar todo"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "script" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, color: "var(--ink)" }}>
                <strong>¿Quieres que Google Sheets se sincronice solo sin importar manualmente?</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                El endpoint de tu CRM en la nube ya está activo en:
                <br />
                <code style={{ background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                  https://campuslands-crm-ashen.vercel.app/api/integrations/sheets
                </code>
              </p>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, borderRadius: 8, fontSize: 12, color: "#1e40af" }}>
                En tu Google Sheet, ve a <strong>Extensiones ➔ Apps Script</strong>, y puedes pegar el código de nuestro archivo <code>Code.gs</code> para enviar automáticamente cualquier cambio en tiempo real al CRM.
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="button" onClick={onClose} disabled={busy}>
            Cerrar
          </button>
          {(activeTab === "paste" || activeTab === "file") && parsedPreview.length > 0 && (
            <button
              type="button"
              className="button primary"
              onClick={executeImport}
              disabled={busy}
            >
              {busy ? <LoaderCircle size={14} className="spin" /> : <Upload size={14} />}
              Importar {parsedPreview.length} contactos al CRM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
