"use client";

import { useState } from "react";
import { Download, Gauge, HardDrive, RefreshCw, Trash2, X, Zap } from "lucide-react";
import type { StorageStats } from "@/hooks/use-crm";
import { hasCloud } from "@/lib/supabase/browser";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function StorageOptimizerModal({
  stats,
  lowBandwidthMode,
  onToggleLowBandwidth,
  onPurgeArchived,
  onCompactCache,
  onExportBackup,
  onResetDemo,
  onClose,
}: {
  stats: StorageStats;
  lowBandwidthMode: boolean;
  onToggleLowBandwidth: (enabled: boolean) => void;
  onPurgeArchived: (daysOld?: number) => Promise<number>;
  onCompactCache: () => void;
  onExportBackup: () => void;
  onResetDemo: () => void;
  onClose: () => void;
}) {
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [busy, setBusy] = useState(false);

  const handlePurge = async () => {
    setBusy(true);
    await onPurgeArchived(90);
    setBusy(false);
    setConfirmPurge(false);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 640, width: "92vw" }}>
        <div className="modal-head">
          <div>
            <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Gauge size={16} style={{ color: "var(--accent)" }} />
              Espacio, RAM y Ancho de Banda
            </div>
            <div className="modal-sub">
              Optimiza manualmente el consumo de memoria, red y almacenamiento local.
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              background: lowBandwidthMode ? "rgba(35, 154, 120, 0.08)" : "var(--surface)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                <Zap size={14} style={{ color: "var(--accent)" }} />
                Modo Ligero (Ahorro de RAM y Datos)
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                Desactiva sincronización Realtime automática, limita lotes a 150 leads y
                pagina tablas a 15 filas.
              </div>
            </div>
            <button
              type="button"
              className={`button small ${lowBandwidthMode ? "primary" : ""}`}
              onClick={() => onToggleLowBandwidth(!lowBandwidthMode)}
            >
              {lowBandwidthMode ? "Activado" : "Activar"}
            </button>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              display: "grid",
              gap: 8,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <HardDrive size={14} /> Uso actual de almacenamiento y memoria
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
              <div>
                Leads en RAM: <strong>{stats.leadsCount}</strong> ({formatBytes(stats.leadsBytes)})
              </div>
              <div>
                Pagos en RAM: <strong>{stats.paymentsCount}</strong> ({formatBytes(stats.paymentsBytes)})
              </div>
              <div>
                Actividades: <strong>{stats.activitiesCount}</strong> ({formatBytes(stats.activitiesBytes)})
              </div>
              <div>
                Total localStorage: <strong>{formatBytes(stats.localBytesTotal)}</strong>
              </div>
              <div>
                Perdidos (+90 días): <strong>{stats.oldLostCount}</strong>
              </div>
              <div>
                Pagos anulados / Teléfonos repetidos:{" "}
                <strong>
                  {stats.voidPaymentsCount} / {stats.duplicatePhoneCount}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="button small" onClick={onExportBackup}>
                <Download size={13} /> Exportar respaldo JSON
              </button>
              <button type="button" className="button small" onClick={onCompactCache}>
                <RefreshCw size={13} /> Compactar caché y RAM
              </button>
              {!hasCloud && (
                <button type="button" className="button small" onClick={onResetDemo}>
                  Restaurar datos demo
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12 }}>
                <strong>Limpieza manual de registros archivados</strong>
                <div style={{ color: "var(--muted)" }}>
                  Elimina leads en etapa «No interesado» con más de 90 días y pagos anulados (
                  {stats.oldLostCount + stats.voidPaymentsCount} candidatos).
                </div>
              </div>
              {!confirmPurge ? (
                <button
                  type="button"
                  className="button small"
                  disabled={stats.oldLostCount + stats.voidPaymentsCount === 0}
                  onClick={() => setConfirmPurge(true)}
                >
                  <Trash2 size={13} /> Limpiar espacio
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="button small"
                    onClick={() => setConfirmPurge(false)}
                    disabled={busy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="button small primary"
                    onClick={handlePurge}
                    disabled={busy}
                  >
                    {busy ? "Limpiando..." : "Confirmar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
