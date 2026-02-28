"use client";

import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { useEffect, useState } from "react";

const PRESET_COLORS = [
  { name: "Primary Blue", value: "#3B82F6" },
  { name: "Success Green", value: "#10B981" },
  { name: "Warning Orange", value: "#F59E0B" },
  { name: "Danger Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Gray", value: "#6B7280" },
];

export default function ColorPickerField() {
  const { client, isInitialized } = useMarketplaceClient();
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [customColor, setCustomColor] = useState("#3B82F6");

  useEffect(() => {
    if (!isInitialized || !client) return;
    const c = client;

    async function initField() {
      try {
        // Custom field extension uses getValue() - not field.context (article was outdated)
        const value = await c.getValue();
        if (value && typeof value === "string") {
          setSelectedColor(value);
          setCustomColor(value);
        }
      } catch (err) {
        console.error("Failed to get field value:", err);
      }
    }

    void initField();
  }, [client, isInitialized]);

  const updateColor = async (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);

    if (!client) return;

    try {
      // Custom field uses setValue() - not field.setValue query (article was outdated)
      await client.setValue(color);
    } catch (err) {
      console.error("Failed to update field:", err);
    }
  };

  return (
    <div className="p-4 max-w-md">
      {/* Color Preview */}
      <div className="mb-6">
        <div
          className="w-full h-24 rounded-lg border-2 border-gray-200 shadow-sm"
          style={{ backgroundColor: selectedColor }}
        />
        <p className="text-center mt-3 text-lg font-mono font-semibold text-gray-700">
          {selectedColor}
        </p>
      </div>

      {/* Preset Colors */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preset Colors
        </label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateColor(color.value)}
              className={`
                h-12 rounded-lg transition-all
                ${selectedColor === color.value 
                  ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' 
                  : 'hover:scale-105'}
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Color
        </label>
        <div className="flex gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-12 w-20 rounded-lg cursor-pointer"
          />
          <button
            onClick={() => updateColor(customColor)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Apply Custom Color
          </button>
        </div>
      </div>
    </div>
  );
}