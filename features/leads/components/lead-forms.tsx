"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, Plus, Settings2, Sparkles, X } from "lucide-react";
import { CAMPUSLANDS_PROGRAMS, getStageSalesGuide } from "@/lib/sales-playbook";
import {
  AGREEMENTS,
  Lead,
  LeadActivity,
  METHODS,
  ORIGINS,
  PAYMENT_STATUSES,
  PRIORITIES,
  PRODUCTS,
  Payment,
  PaymentMethod,
  Stage,
  STAGES,
  money,
} from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  AgreementBadge,
  LeadAvatar,
  PaymentStatusBadge,
  PriorityBadge,
  StageBadge,
} from "@/components/ui/crm-primitives";

export function LeadForm({
  lead,
  onClose,
  onSave,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}) {
  const [draft, setDraft] = useState(lead);
  const patch = (key: keyof Lead, value: string | number) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="modal"
        style={{ maxWidth: 640 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Nuevo lead</div>
            <div className="modal-sub">Agrega un nuevo prospecto al embudo comercial de Campuslands.</div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">
          <LeadFields draft={draft} patch={patch} />
        </div>
        <div className="modal-foot">
          <span className="count-label">Los campos con * son obligatorios.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary">
              <Plus size={14} /> Guardar lead
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function LeadFields({
  draft,
  patch,
}: {
  draft: Lead;
  patch: (key: keyof Lead, value: string | number) => void;
}) {
  return (
    <div className="form-grid">
      <label className="form-field">
        <span className="form-label">Nombre completo *</span>
        <input
          className="field"
          required
          value={draft.full_name}
          onChange={(e) => patch("full_name", e.target.value)}
          placeholder="Nombre del contacto"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Teléfono / WhatsApp *</span>
        <input
          className="field"
          required
          type="tel"
          value={draft.phone}
          onChange={(e) => patch("phone", e.target.value)}
          placeholder="+502 0000 0000"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Correo</span>
        <input
          className="field"
          type="email"
          value={draft.email}
          onChange={(e) => patch("email", e.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Origen</span>
        <select
          className="select"
          value={draft.origin}
          onChange={(e) => patch("origin", e.target.value)}
        >
          {ORIGINS.map((orig) => (
            <option key={orig} value={orig}>
              {orig}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Producto / Programa</span>
        <select
          className="select"
          value={draft.product || "CODE UP"}
          onChange={(e) => patch("product", e.target.value)}
        >
          {PRODUCTS.map((prod) => (
            <option key={prod} value={prod}>
              {prod}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Estado (Flujo de Cierre)</span>
        <select
          className="select"
          value={draft.stage}
          onChange={(e) => patch("stage", e.target.value)}
        >
          {STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Prioridad</span>
        <select
          className="select"
          value={draft.priority || "SEGUIMIENTO"}
          onChange={(e) => patch("priority", e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Acuerdo</span>
        <select
          className="select"
          value={draft.agreement || ""}
          onChange={(e) => patch("agreement", e.target.value)}
        >
          <option value="">Por definir</option>
          {AGREEMENTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Gestión de Pago</span>
        <select
          className="select"
          value={draft.payment_status || ""}
          onChange={(e) => patch("payment_status", e.target.value)}
        >
          <option value="">Por definir</option>
          {PAYMENT_STATUSES.map((ps) => (
            <option key={ps} value={ps}>
              {ps}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">NIT</span>
        <input
          className="field"
          value={draft.nit || ""}
          onChange={(e) => patch("nit", e.target.value)}
          placeholder="C/F o número de NIT"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Monto del trato (GTQ)</span>
        <input
          className="field"
          type="number"
          min="0"
          step="0.01"
          value={draft.deal_amount || ""}
          onChange={(e) => patch("deal_amount", Number(e.target.value))}
          placeholder="0.00"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Método de pago</span>
        <select
          className="select"
          value={draft.payment_method}
          onChange={(e) => patch("payment_method", e.target.value)}
        >
          <option value="">Por definir</option>
          {METHODS.map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span className="form-label">Próximo contacto</span>
        <input
          className="field"
          type="date"
          value={draft.next_contact_at}
          onChange={(e) => patch("next_contact_at", e.target.value)}
        />
      </label>

      <label className="form-field full">
        <span className="form-label">Observaciones / Comentario</span>
        <textarea
          className="textarea"
          value={draft.notes}
          onChange={(e) => patch("notes", e.target.value)}
          placeholder="Interés, acuerdos, preguntas, seguimiento…"
        />
      </label>
    </div>
  );
}

export function LeadDetail({
  lead,
  payments,
  activities,
  onClose,
  onSave,
  onMove,
  onWhatsApp,
  onOpenSalesAssistant,
  onLogNote,
  onAddPayment,
  tell,
}: {
  lead: Lead;
  payments: Payment[];
  activities: LeadActivity[];
  onClose: () => void;
  onSave: (lead: Lead) => void;
  onMove: (stage: Stage) => void;
  onWhatsApp: (customMessage?: string) => void;
  onOpenSalesAssistant?: () => void;
  onLogNote?: (description: string) => Promise<boolean>;
  onAddPayment: (payment: Omit<Payment, "id" | "created_at">) => Promise<void>;
  tell: (message: string) => void;
}) {
  const [draft, setDraft] = useState(lead);
  const [editing, setEditing] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  useEffect(() => {
    setDraft(lead);
  }, [lead]);

  const patch = (key: keyof Lead, value: string | number) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const received = payments
    .filter((payment) => payment.status === "pagado")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const stageGuide = getStageSalesGuide(lead);
  const stageScript = stageGuide.getScript(lead);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal wide" style={{ maxWidth: 840 }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Ficha de Admisión</div>
            <div className="detail-header">
              <LeadAvatar name={lead.full_name} />
              <div>
                <div className="detail-name" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {lead.full_name}
                  {lead.priority && <PriorityBadge priority={lead.priority} />}
                </div>
                <div className="detail-phone">
                  <strong>{lead.phone}</strong> {lead.email && `· ${lead.email}`} · {lead.origin || "BOT"}
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="button small whatsapp-action"
                  onClick={() => onWhatsApp()}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
                {onOpenSalesAssistant && (
                  <button className="button small primary" onClick={onOpenSalesAssistant}>
                    <Sparkles size={13} /> Ventas / Cotizar
                  </button>
                )}
                <button className="button small" onClick={() => setEditing(!editing)}>
                  <Settings2 size={13} />
                  {editing ? "Cancelar edición" : "Editar ficha"}
                </button>
              </div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          {editing ? (
            <div>
              <LeadFields draft={draft} patch={patch} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button type="button" className="button" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    onSave(draft);
                    setEditing(false);
                  }}
                >
                  <Check size={14} /> Guardar cambios
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-grid">
                <div className="detail-stat">
                  <div className="detail-stat-label">Estado (Flujo de Cierre)</div>
                  <div className="detail-stat-value">
                    <select
                      className="select stage-select"
                      value={lead.stage}
                      onChange={(e) => onMove(e.target.value as Stage)}
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Programa</div>
                  <div className="detail-stat-value" style={{ fontWeight: 600, color: "#2563eb" }}>
                    {lead.product || "CODE UP"}
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Prioridad</div>
                  <div className="detail-stat-value">
                    <PriorityBadge priority={lead.priority} />
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Acuerdo</div>
                  <div className="detail-stat-value">
                    <AgreementBadge agreement={lead.agreement} />
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Gestión de Pago</div>
                  <div className="detail-stat-value">
                    <PaymentStatusBadge status={lead.payment_status} />
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">NIT</div>
                  <div className="detail-stat-value">{lead.nit || "C/F"}</div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Monto del trato</div>
                  <div className="detail-stat-value">{money(lead.deal_amount)}</div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Ingresos cobrados</div>
                  <div className="detail-stat-value" style={{ color: "#16a34a" }}>
                    {money(received)}
                  </div>
                </div>

                <div className="detail-stat">
                  <div className="detail-stat-label">Próximo contacto</div>
                  <div className="detail-stat-value">
                    {formatDate(lead.next_contact_at)}
                  </div>
                </div>
              </div>

              {/* Guía rápida para la fase */}
              <div className="section-label" style={{ marginTop: 16 }}>Guía rápida de conversación</div>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 14,
                  background: "var(--bg)",
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{stageGuide.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  <strong>Objetivo:</strong> {stageGuide.goal}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  <strong>Siguiente paso:</strong> {stageGuide.nextStep}
                </div>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 10,
                    lineHeight: 1.45,
                    fontSize: 12,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{stageScript}&rdquo;
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button small primary"
                    onClick={() => onWhatsApp(stageScript)}
                  >
                    <MessageCircle size={12} /> Enviar este guion por WhatsApp
                  </button>
                </div>
              </div>

              {/* Notas de seguimiento */}
              <div className="section-label" style={{ marginTop: 16 }}>Observaciones y Comentarios</div>
              <div className="note-card" style={{ fontSize: 13 }}>
                {lead.notes || "Sin observaciones registradas."}
              </div>

              {/* Bitácora rápida */}
              {onLogNote && (
                <div style={{ marginTop: 16 }}>
                  <div className="section-label">Registrar llamada o acuerdo</div>
                  <form
                    style={{ display: "flex", gap: 8, marginBottom: 8 }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!quickNote.trim()) return;
                      setNoteBusy(true);
                      const ok = await onLogNote(quickNote.trim());
                      setNoteBusy(false);
                      if (ok) {
                        setQuickNote("");
                        tell("Seguimiento registrado en la bitácora.");
                      }
                    }}
                  >
                    <input
                      className="field"
                      placeholder="Ej: Se llamó a las 3pm, pide facilidades de pago en 2 cuotas…"
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                    />
                    <button className="button small" disabled={noteBusy || !quickNote.trim()}>
                      {noteBusy ? "Guardando…" : "Registrar"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="button" onClick={onClose}>
            Cerrar ficha
          </button>
        </div>
      </section>
    </div>
  );
}
