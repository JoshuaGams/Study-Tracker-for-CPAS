import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  Type,
  Layout,
  CheckCircle2,
  Brush,
  Pipette,
  Maximize2,
} from 'lucide-react';
import { DashboardTheme, BackgroundMode, FontStyle } from '../types';
import { Modal } from './Modal';
import {
  PRESET_THEMES,
  DEFAULT_THEME,
  POPULAR_ACCENT_COLORS,
  POPULAR_TEXT_COLORS,
  POPULAR_CANVAS_COLORS,
  BACKGROUND_MODE_DEFINITIONS,
  applyThemeToDocument,
  getContrastTextColor,
  isColorLight,
} from '../lib/theme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DashboardTheme;
  onSaveTheme: (newTheme: DashboardTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme = DEFAULT_THEME,
  onSaveTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedTheme, setSelectedTheme] = useState<DashboardTheme>(currentTheme);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(currentTheme || DEFAULT_THEME);
      setSaveFeedback(false);
    }
  }, [isOpen, currentTheme]);

  // Select a curated preset
  const handleSelectPreset = useCallback(
    (preset: DashboardTheme) => {
      const newTheme = { ...preset, isCustom: false };
      setSelectedTheme(newTheme);
      applyThemeToDocument(newTheme);
      onSaveTheme(newTheme);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 1200);
    },
    [onSaveTheme]
  );

  // Single atomic updater for custom fields
  const updateCustomTheme = useCallback(
    (updates: Partial<DashboardTheme>) => {
      setSelectedTheme((prev) => {
        const next: DashboardTheme = {
          ...prev,
          ...updates,
          isCustom: true,
        };
        applyThemeToDocument(next);
        onSaveTheme(next);
        return next;
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 1200);
    },
    [onSaveTheme]
  );

  const handleResetDefault = useCallback(() => {
    setSelectedTheme(DEFAULT_THEME);
    applyThemeToDocument(DEFAULT_THEME);
    onSaveTheme(DEFAULT_THEME);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1200);
  }, [onSaveTheme]);

  const handleSaveAndClose = useCallback(() => {
    onSaveTheme(selectedTheme);
    applyThemeToDocument(selectedTheme);
    onClose();
  }, [onSaveTheme, selectedTheme, onClose]);

  const bgDef = BACKGROUND_MODE_DEFINITIONS[selectedTheme.backgroundMode] || BACKGROUND_MODE_DEFINITIONS['dark-slate'];
  const isLightMode = selectedTheme.customBgColor ? isColorLight(selectedTheme.customBgColor) : bgDef.isLight;

  // Effective preview text & canvas colors
  const previewTextMain = selectedTheme.textColor || (isLightMode ? '#0f172a' : bgDef.textMain);
  const previewTextMuted = selectedTheme.textMutedColor || (isLightMode ? '#334155' : bgDef.textMuted);
  const previewBg = selectedTheme.customBgColor || bgDef.bgMain;
  const previewCard = selectedTheme.customCardColor || (isLightMode ? '#ffffff' : bgDef.bgCard);
  const contrastBtnText = getContrastTextColor(selectedTheme.accentColor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSaveAndClose}
      title="Dashboard Theme & Appearance Studio"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Navigation Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premade Themes ({PRESET_THEMES.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Palette Studio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Reset to default CPALE Gold theme"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
        </div>

        {/* ======================= TAB 1: PREMADE THEMES ======================= */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
              <span>Select a curated study environment preset:</span>
              <span className="text-[11px] text-amber-500/90 font-bold">
                {PRESET_THEMES.filter((p) => BACKGROUND_MODE_DEFINITIONS[p.backgroundMode]?.isLight).length} Light ·{' '}
                {PRESET_THEMES.filter((p) => !BACKGROUND_MODE_DEFINITIONS[p.backgroundMode]?.isLight).length} Dark
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
              {PRESET_THEMES.map((preset) => {
                const isSelected = selectedTheme.id === preset.id && !selectedTheme.isCustom;
                const pBg = BACKGROUND_MODE_DEFINITIONS[preset.backgroundMode];

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative p-3 rounded-xl border text-left transition-all group flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-900 shadow-md'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0 border border-slate-700/50"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span className="font-semibold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                            {preset.name}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-2.5">
                        {preset.description}
                      </p>
                    </div>

                    {/* Color Swatch Preview Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-md border border-slate-700 shadow-xs flex items-center justify-center text-[8px] font-bold"
                          style={{
                            backgroundColor: preset.accentColor,
                            color: getContrastTextColor(preset.accentColor),
                          }}
                          title={`Accent: ${preset.accentColor}`}
                        >
                          A
                        </div>
                        {preset.secondaryAccentColor && (
                          <div
                            className="w-4 h-4 rounded-md border border-slate-700 shadow-xs"
                            style={{ backgroundColor: preset.secondaryAccentColor }}
                            title={`Secondary: ${preset.secondaryAccentColor}`}
                          />
                        )}
                        <div
                          className="w-4 h-4 rounded-md border border-slate-700 shadow-xs"
                          style={{ backgroundColor: pBg.bgMain }}
                          title={`Canvas: ${pBg.name}`}
                        />
                        <div
                          className="w-4 h-4 rounded-md border border-slate-700 shadow-xs flex items-center justify-center text-[8px] font-bold"
                          style={{ backgroundColor: pBg.bgCard, color: pBg.textMain }}
                          title={`Text: ${pBg.textMain}`}
                        >
                          T
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          pBg.isLight
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {pBg.isLight ? '☀ Light Mode' : '☾ Dark Mode'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 2: CUSTOM PALETTE STUDIO ======================= */}
        {activeTab === 'custom' && (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {/* 1. Canvas Background & Lighting Tone (Responsive & Immediate) */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Canvas Background Atmosphere</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {selectedTheme.customBgColor || bgDef.name}
                  </span>
                  <div
                    className="w-4 h-4 rounded-md border border-slate-700 shadow-xs"
                    style={{ backgroundColor: previewBg }}
                  />
                </div>
              </div>

              {/* 8 Preset Atmosphere Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(Object.keys(BACKGROUND_MODE_DEFINITIONS) as BackgroundMode[]).map((mode) => {
                  const def = BACKGROUND_MODE_DEFINITIONS[mode];
                  const isSelected = selectedTheme.backgroundMode === mode && !selectedTheme.customBgColor;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        updateCustomTheme({
                          backgroundMode: mode,
                          customBgColor: undefined,
                          customCardColor: undefined,
                        });
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-slate-800 text-slate-100 shadow-xs ring-1 ring-amber-400/30'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="w-3 h-3 rounded-md border border-slate-700 shrink-0 shadow-xs"
                          style={{ backgroundColor: def.bgMain }}
                        />
                        {def.isLight ? (
                          <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : (
                          <Moon className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                      </div>
                      <div className="font-semibold text-xs truncate text-slate-200">{def.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{def.isLight ? 'Light Mode' : 'Dark Mode'}</div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Canvas Palette Swatches */}
              <div className="pt-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Direct Canvas Swatches:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {POPULAR_CANVAS_COLORS.map((cc) => {
                    const isCurrent =
                      selectedTheme.customBgColor?.toLowerCase() === cc.hex.toLowerCase() ||
                      (!selectedTheme.customBgColor && bgDef.bgMain.toLowerCase() === cc.hex.toLowerCase());

                    return (
                      <button
                        key={cc.hex}
                        type="button"
                        onClick={() => {
                          updateCustomTheme({
                            customBgColor: cc.hex,
                            customCardColor: undefined,
                          });
                        }}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-amber-400 bg-slate-800 text-slate-100 font-semibold ring-1 ring-amber-400/30'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-slate-700"
                          style={{ backgroundColor: cc.hex }}
                        />
                        <span className="truncate text-[11px]">{cc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Canvas Background Hex Input */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={selectedTheme.customBgColor || bgDef.bgMain}
                  onChange={(e) => updateCustomTheme({ customBgColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Custom Canvas Background Hex</div>
                  <input
                    type="text"
                    value={selectedTheme.customBgColor || ''}
                    onChange={(e) => updateCustomTheme({ customBgColor: e.target.value })}
                    placeholder={bgDef.bgMain}
                    className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                {selectedTheme.customBgColor && (
                  <button
                    type="button"
                    onClick={() => updateCustomTheme({ customBgColor: undefined })}
                    className="text-[10px] text-amber-400 hover:underline font-mono px-2 py-1 bg-amber-500/10 rounded cursor-pointer"
                  >
                    Reset to Preset
                  </button>
                )}
              </div>
            </div>

            {/* 2. Primary Font / Text Color Studio */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Font & Text Color Studio</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {selectedTheme.textColor || `${previewTextMain} (Auto)`}
                  </span>
                  <div
                    className="w-4 h-4 rounded-md border border-slate-700 shadow-xs"
                    style={{ backgroundColor: previewTextMain }}
                  />
                </div>
              </div>

              {/* Curated Font Color Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updateCustomTheme({
                      textColor: undefined,
                      textMutedColor: undefined,
                    });
                  }}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    !selectedTheme.textColor
                      ? 'border-amber-400 bg-slate-800 text-slate-100 font-semibold ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-slate-700"
                    style={{ backgroundColor: isLightMode ? '#0f172a' : '#f8fafc' }}
                  />
                  <span className="truncate text-[11px]">Auto (Canvas Match)</span>
                </button>

                {POPULAR_TEXT_COLORS.map((tc) => {
                  const isCurrent = selectedTheme.textColor?.toLowerCase() === tc.hex.toLowerCase();
                  return (
                    <button
                      key={tc.hex}
                      type="button"
                      onClick={() => updateCustomTheme({ textColor: tc.hex })}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-amber-400 bg-slate-800 text-slate-100 font-semibold ring-1 ring-amber-400/30'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-slate-700"
                        style={{ backgroundColor: tc.hex }}
                      />
                      <span className="truncate text-[11px]">{tc.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Font Color Hex Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={selectedTheme.textColor || previewTextMain}
                    onChange={(e) => updateCustomTheme({ textColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-[9px] font-mono text-slate-400 uppercase">Primary Text Hex</div>
                    <input
                      type="text"
                      value={selectedTheme.textColor || ''}
                      onChange={(e) => updateCustomTheme({ textColor: e.target.value })}
                      placeholder={previewTextMain}
                      className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={selectedTheme.textMutedColor || previewTextMuted}
                    onChange={(e) => updateCustomTheme({ textMutedColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-[9px] font-mono text-slate-400 uppercase">Muted / Subtext Hex</div>
                    <input
                      type="text"
                      value={selectedTheme.textMutedColor || ''}
                      onChange={(e) => updateCustomTheme({ textMutedColor: e.target.value })}
                      placeholder={previewTextMuted}
                      className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Primary Accent Color Customization */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Primary Accent & Highlight Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{selectedTheme.accentColor}</span>
                  <div
                    className="w-4 h-4 rounded-md border border-slate-700 shadow-xs"
                    style={{ backgroundColor: selectedTheme.accentColor }}
                  />
                </div>
              </div>

              {/* Curated Swatch Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {POPULAR_ACCENT_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => updateCustomTheme({ accentColor: col.hex })}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedTheme.accentColor.toLowerCase() === col.hex.toLowerCase()
                        ? 'border-amber-400 bg-slate-800 text-slate-100 font-semibold ring-1 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="truncate text-[11px]">{col.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color HEX / Picker Input */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={selectedTheme.accentColor}
                  onChange={(e) => updateCustomTheme({ accentColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Custom Accent Hex</div>
                  <input
                    type="text"
                    value={selectedTheme.accentColor}
                    onChange={(e) => updateCustomTheme({ accentColor: e.target.value })}
                    placeholder="#F59E0B"
                    className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Heading Typography Style */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Typography Archetype</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateCustomTheme({ fontStyle: 'serif-heading' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTheme.fontStyle === 'serif-heading'
                      ? 'border-amber-400 bg-slate-900 font-bold ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-serif text-sm text-slate-100 mb-0.5">Classic Serif</div>
                  <div className="text-[10px] text-slate-400 font-sans font-normal">Academic Board</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateCustomTheme({ fontStyle: 'modern-sans' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTheme.fontStyle === 'modern-sans'
                      ? 'border-amber-400 bg-slate-900 font-bold ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-sans text-sm text-slate-100 mb-0.5">Modern Sans</div>
                  <div className="text-[10px] text-slate-400 font-sans font-normal">Clean Executive</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateCustomTheme({ fontStyle: 'academic-mono' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTheme.fontStyle === 'academic-mono'
                      ? 'border-amber-400 bg-slate-900 font-bold ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-sm text-slate-100 mb-0.5">Precision Mono</div>
                  <div className="text-[10px] text-slate-400 font-sans font-normal">Diagnostic Tech</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= LIVE INTERACTIVE PREVIEW CARD ======================= */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-amber-400" />
              Live Dashboard Element Contrast Preview
            </span>
            <span className="text-amber-400 font-semibold">{selectedTheme.name || 'Custom Theme'}</span>
          </div>

          <div
            className="p-3.5 rounded-xl border transition-all shadow-xs"
            style={{
              backgroundColor: previewCard,
              borderColor: bgDef.border,
              color: previewTextMain,
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                  style={{
                    backgroundColor: `${selectedTheme.accentColor}25`,
                    color: isLightMode ? '#b45309' : selectedTheme.accentColor,
                    borderColor: `${selectedTheme.accentColor}50`,
                    borderWidth: '1px',
                  }}
                >
                  RFBT-01
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: previewTextMain,
                    fontFamily:
                      selectedTheme.fontStyle === 'modern-sans'
                        ? "'Plus Jakarta Sans', sans-serif"
                        : selectedTheme.fontStyle === 'academic-mono'
                        ? "'JetBrains Mono', monospace"
                        : "'Instrument Serif', Georgia, serif",
                  }}
                >
                  Law on Obligations & Contracts
                </span>
              </div>

              <span
                className="text-xs font-mono font-bold"
                style={{ color: isLightMode ? '#047857' : selectedTheme.accentColor }}
              >
                85% Mastery (Strong)
              </span>
            </div>

            <p
              className="text-xs mb-3 line-clamp-1"
              style={{ color: previewTextMuted }}
            >
              Essential concepts: Fortuitous events, joint vs solidary obligations, breach remedies.
            </p>

            {/* Simulated progress bar & buttons */}
            <div className="space-y-2">
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: isLightMode ? '#e2e8f0' : bgDef.bgSurfaceHover }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: '78%',
                    backgroundColor: selectedTheme.accentColor,
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    style={{
                      backgroundColor: selectedTheme.accentColor,
                      color: contrastBtnText,
                    }}
                  >
                    Start Stopwatch
                  </button>
                  <span
                    className="text-xs font-mono"
                    style={{ color: previewTextMuted }}
                  >
                    42 Days to Board Exam
                  </span>
                </div>

                <div
                  className="text-xs font-mono font-bold"
                  style={{ color: isLightMode ? '#0369a1' : selectedTheme.accentColor }}
                >
                  Active Subject
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Theme applies instantly
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveFeedback && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Applied!
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Done & Close</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
