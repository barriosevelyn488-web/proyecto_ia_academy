"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  Copy,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { METHODS, money } from "@/lib/types";
import {
  CAMPUSLANDS_OBJECTIONS,
  CAMPUSLANDS_PROGRAMS,
  SALES_QUICK_REPLIES,
  buildCallScript,
  buildQuickQuote,
  formatSalesTemplate,
} from "@/lib/sales-playbook";

type Tab = "whatsapp" | "objections" | "quote" | "call";

export function SalesToolkitModal({
  lead,
  onClose,
  onSendWhatsApp,
  onNotify,
}: {
  lead?: Lead | null;
  onClose: () => void;
  onSendWhatsApp: (lead: Lead, customMessage: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("whatsapp");
  const [copiedId, setCopiedId] = useState("");

  const matchedProgram = useMemo(
    () =>
      CAMPUSLANDS_PROGRAMS.find(
        (p) => lead?.product && p.name.toLowerCase() === lead.product.toLowerCase(),
      ) ?? CAMPUSLANDS_PROGRAMS[0],
    [lead?.product],
  );

  const [programName, setProgramName] = useState(
    lead?.product || matchedProgram.name,
  );
  const [unitPrice, setUnitPrice] = useState(
    lead?.deal_amount && lead.deal_amount > 0
      ? lead.deal_amount
      : matchedProgram.suggestedPrice,
  );
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [includesIva, setIncludesIva] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    lead?.payment_method || "Transferencia",
  );
  const [validDays, setValidDays] = useState(7);

  const quote = useMemo(
    () =>
      buildQuickQuote({
        clientName: lead?.full_name || "",
        programName,
        unitPrice,
        quantity,
        discountPercent,
        installments,
        includesIva,
        paymentMethod,
        validDays,
      }),
    [
      discountPercent,
      includesIva,
      installments,
      lead?.full_name,
      paymentMethod,
      programName,
      quantity,
      unitPrice,
      validDays,
    ],
  );

  const callScript = useMemo(() => buildCallScript(lead), [lead]);

  const copyText = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      onNotify("Texto copiado al portapapeles.");
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      onNotify("No se pudo copiar automáticamente.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 780, width: "94vw" }}>
        <div className="modal-head">
          <div>
            <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "var(--accent)" }} />
              Asistente Comercial · Campuslands
            </div>
            <div className="modal-sub">
              {lead
                ? `Preparado para ${lead.full_name} · ${lead.product || "Sin programa"}`
                : "Plantillas de WhatsApp, manejo de objeciones, cotizador GTQ y guion de llamada"}
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 20px",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className={`button small ${tab === "whatsapp" ? "primary" : ""}`}
            onClick={() => setTab("whatsapp")}
          >
            <MessageCircle size={13} /> WhatsApp rápido
          </button>
          <button
            type="button"
            className={`button small ${tab === "objections" ? "primary" : ""}`}
            onClick={() => setTab("objections")}
          >
            <ShieldAlert size={13} /> Objeciones
          </button>
          <button
            type="button"
            className={`button small ${tab === "quote" ? "primary" : ""}`}
            onClick={() => setTab("quote")}
          >
            <Calculator size={13} /> Cotizador GTQ
          </button>
          <button
            type="button"
            className={`button small ${tab === "call" ? "primary" : ""}`}
            onClick={() => setTab("call")}
          >
            <PhoneCall size={13} /> Guion de llamada
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {tab === "whatsapp" && (
            <div style={{ display: "grid", gap: 12 }}>
              {SALES_QUICK_REPLIES.map((tpl) => {
                const text = formatSalesTemplate(tpl.body, lead);
                const recommended = lead && tpl.stage === lead.stage;
                return (
                  <div
                    key={tpl.id}
                    style={{
                      border: recommended
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        <code style={{ marginRight: 6, color: "var(--accent)" }}>
                          {tpl.shortcut}
                        </code>
                        {tpl.title}
                        {recommended && (
                          <span className="badge green" style={{ marginLeft: 8 }}>
                            Recomendado para su etapa
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="button small"
                          onClick={() => copyText(tpl.id, text)}
                        >
                          {copiedId === tpl.id ? <Check size={12} /> : <Copy size={12} />}
                          Copiar
                        </button>
                        {lead && (
                          <button
                            type="button"
                            className="button small primary"
                            onClick={() => onSendWhatsApp(lead, text)}
                          >
                            <MessageCircle size={12} /> Abrir WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "objections" && (
            <div style={{ display: "grid", gap: 12 }}>
              {CAMPUSLANDS_OBJECTIONS.map((item) => {
                const waText = formatSalesTemplate(item.whatsappResponse, lead);
                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{item.objection}</strong>
                      <span className="origin-chip">{item.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      <strong>Qué hay detrás:</strong> {item.behindIt}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <strong>Pregunta para destrabar:</strong> {item.unlockQuestion}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <strong>En llamada:</strong> {item.callResponse}
                    </div>
                    <div
                      style={{
                        background: "var(--bg)",
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>
                        <strong>WhatsApp:</strong> {waText}
                      </span>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="button small"
                          onClick={() => copyText(item.id, waText)}
                        >
                          {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        {lead && (
                          <button
                            type="button"
                            className="button small primary"
                            onClick={() => onSendWhatsApp(lead, waText)}
                          >
                            <MessageCircle size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#b45309" }}>
                      <strong>Evitar:</strong> {item.avoidSaying}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "quote" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="form-grid">
                <label className="form-field">
                  <span className="form-label">Programa / Producto</span>
                  <select
                    className="select"
                    value={programName}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setProgramName(nextName);
                      const found = CAMPUSLANDS_PROGRAMS.find((p) => p.name === nextName);
                      if (found) setUnitPrice(found.suggestedPrice);
                    }}
                  >
                    {CAMPUSLANDS_PROGRAMS.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({money(p.suggestedPrice)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Precio unitario (GTQ)</span>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Participantes / Cupos</span>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Descuento autorizado (%)</span>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Cuotas (1 = contado)</span>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    max="12"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Forma de pago</span>
                  <select
                    className="select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Vigencia (días)</span>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    max="60"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                  />
                </label>
                <label className="form-field" style={{ justifyContent: "flex-end" }}>
                  <span className="form-label">Impuesto</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={includesIva}
                      onChange={(e) => setIncludesIva(e.target.checked)}
                    />
                    Precio ya incluye IVA (12%)
                  </label>
                </label>
              </div>

              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  background: "var(--bg)",
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Base sin IVA:</span>
                  <strong>{money(quote.baseWithoutIva)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>IVA (12%):</span>
                  <strong>{money(quote.ivaAmount)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                  <span>Total cotización:</span>
                  <strong style={{ color: "var(--accent)" }}>
                    {money(quote.totalWithIva)}
                  </strong>
                </div>
                {quote.installments > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                    <span>Plan en {quote.installments} cuotas:</span>
                    <span>{money(quote.installmentAmount)} / cuota</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  Mensaje listo para WhatsApp
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {quote.whatsappText}
                </pre>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button small"
                    onClick={() => copyText("quote", quote.whatsappText)}
                  >
                    {copiedId === "quote" ? <Check size={12} /> : <Copy size={12} />}
                    Copiar cotización
                  </button>
                  {lead && (
                    <button
                      type="button"
                      className="button small primary"
                      onClick={() => onSendWhatsApp(lead, quote.whatsappText)}
                    >
                      <MessageCircle size={12} /> Enviar por WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "call" && (
            <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Objetivo de la llamada</div>
                <div>{callScript.objective}</div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Apertura</div>
                <div>{callScript.opening}</div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>2. Preguntas clave</div>
                <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  {callScript.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>3. Cierre con acuerdo</div>
                <div>{callScript.closing}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
