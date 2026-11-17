"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, RotateCcw, Settings, Trash2, X } from "lucide-react";
import { STAGES as DEFAULT_STAGES, Stage } from "@/lib/types";

export type CustomStage = {
  id: string;
  label: string;
  color: string;
  bg: string;
};

const COLOR_PRESETS = [
  { color: "#3b82f6", bg: "#eff6ff", label: "Azul" },
  { color: "#f59e0b", bg: "#fef3c7", label: "Ámbar / Naranja" },
  { color: "#10b981", bg: "#ecfdf5", label: "Verde menta" },
  { color: "#16a34a", bg: "#dcfce7", label: "Verde esmeralda" },
  { color: "#0d9488", bg: "#ccfbf1", label: "Verde azulado" },
  { color: "#8b5cf6", bg: "#f3e8ff", label: "Morado / Violeta" },
  { color: "#ec4899", bg: "#fdf2f8", label: "Rosa" },
  { color: "#6b7280", bg: "#f3f4f6", label: "Gris" },
  { color: "#dc2626", bg: "#fee2e2", label: "Rojo" },
];

export function StageCustomizerModal({
  isOpen,
  onClose,
  stages,
  onSaveStages,
  onNotify,
}: {
  isOpen: boolean;
  onClose: () => void;
  stages: CustomStage[];
  onSaveStages: (updated: CustomStage[]) => void;
  onNotify: (msg: string) => void;
}) {
  const [list, setList] = useState<CustomStage[]>(stages);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);

  if (!isOpen) return null;

  const handleUpdateLabel = (idx: number, label: string) => {
    setList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label } : item)),
    );
  };

  const handleUpdateColor = (idx: number, colorPreset: (typeof COLOR_PRESETS)[0]) => {
    setList((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, color: colorPreset.color, bg: colorPreset.bg } : item,
      ),
    );
  };

  const handleMove = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const nextList = [...list];
    const [moved] = nextList.splice(idx, 1);
    nextList.splice(targetIdx, 0, moved);
    setList(nextList);
  };

  const handleDelete = (idx: number) => {
    if (list.length <= 2) {
      onNotify("Debes mantener al menos 2 etapas en el embudo.");
      return;
    }
    setList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddStage = () => {
    if (!newLabel.trim()) {
      onNotify("Ingresa un nombre para la nueva etapa.");
      return;
    }
    const slug = newLabel
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_");

    const newStageItem: CustomStage = {
      id: `${slug}_${Date.now().toString().slice(-4)}`,
      label: newLabel.trim(),
      color: newColor.color,
      bg: newColor.bg,
    };

    setList((prev) => [...prev, newStageItem]);
    setNewLabel("");
  };

  const handleResetDefaults = () => {
    setList(DEFAULT_STAGES);
    onNotify("Etapas restablecidas a los 7 estados oficiales de Google Sheets.");
  };

  const handleSave = () => {
    onSaveStages(list);
    onNotify("¡Etapas guardadas exitosamente!");
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Settings size={18} style={{ color: "var(--purple)" }} />
              Personalizar Etapas del Embudo
            </div>
            <div className="modal-sub">
              Edita nombres, colores, orden o crea tus propias etapas a tu antojo en tiempo real.
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 14 }}>
          {/* Lista de etapas actuales */}
          <div style={{ display: "grid", gap: 8 }}>
            {list.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "var(--bg-subtle)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                {/* Selector de color */}
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <input
                    type="color"
                    value={item.color}
                    onChange={(e) => {
                      const color = e.target.value;
                      setList((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, color, bg: `${color}18` } : it)),
                      );
                    }}
                    style={{ width: 24, height: 24, padding: 0, border: 0, borderRadius: 4, cursor: "pointer" }}
                    title="Cambiar color"
                  />
                </div>

                {/* Nombre de la etapa editable */}
                <input
                  className="field small"
                  value={item.label}
                  onChange={(e) => handleUpdateLabel(idx, e.target.value)}
                  style={{ flex: 1, height: 32, fontWeight: 600 }}
                  placeholder="Nombre de la etapa"
                />

                {/* Botones de orden */}
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: 28, height: 28 }}
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  title="Subir orden"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: 28, height: 28 }}
                  disabled={idx === list.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  title="Bajar orden"
                >
                  <ArrowDown size={12} />
                </button>

                {/* Botón borrar */}
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: 28, height: 28, color: "var(--red)" }}
                  onClick={() => handleDelete(idx)}
                  title="Eliminar etapa"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Formulario para agregar nueva etapa */}
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 8,
              padding: 12,
              background: "#fafafa",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="color"
              value={newColor.color}
              onChange={(e) => setNewColor({ color: e.target.value, bg: `${e.target.value}18`, label: "Personalizado" })}
              style={{ width: 28, height: 28, padding: 0, border: 0, borderRadius: 4, cursor: "pointer" }}
            />
            <input
              className="field small"
              placeholder="Nombre de nueva etapa (ej: Pendiente de segunda llamada)..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{ flex: 1, height: 32 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStage();
                }
              }}
            />
            <button type="button" className="button small" onClick={handleAddStage}>
              <Plus size={13} /> Agregar
            </button>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="button small" onClick={handleResetDefaults} style={{ color: "var(--muted)" }}>
            <RotateCcw size={12} /> Restaurar por defecto
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="button primary" onClick={handleSave}>
              <Check size={14} /> Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
