import React, { useState, useMemo, useRef } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { DistrictFeature, GeoJsonData, RiskCategory } from '../types';
import { getRiskCategory, getRiskColor } from '../utils/lpi';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Layers, AlertCircle } from 'lucide-react';

interface MapViewerProps {
  geoData: GeoJsonData;
  selectedDistrict: string | null;
  onSelectDistrict: (districtName: string) => void;
  riskFilter: 'ALL' | RiskCategory;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  geoData,
  selectedDistrict,
  onSelectDistrict,
  riskFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    feature: DistrictFeature | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    feature: null,
  });

  const width = 880;
  const height = 580;

  // Compute projection and path generator
  const { projectedFeatures } = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      geoData as any
    );

    const pathGen = geoPath().projection(projection);

    const featuresWithPaths = geoData.features.map((feat) => {
      const path = pathGen(feat as any);
      const centroid = pathGen.centroid(feat as any);
      const lpi = feat.properties.Learning_Poverty_Score || 0;
      const risk = getRiskCategory(lpi);
      const color = getRiskColor(risk);

      return {
        feature: feat,
        path,
        centroid,
        name: feat.properties.matchedName || feat.properties.District || feat.properties.district,
        lpi,
        risk,
        color,
      };
    });

    return { projectedFeatures: featuresWithPaths };
  }, [geoData]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Compute cursor position relative to map container with boundary clamping
  const updateTooltipPosition = (e: React.MouseEvent, feat: DistrictFeature) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const ttWidth = 240;
    const ttHeight = 175;

    const posX = mouseX + ttWidth + 20 > rect.width ? mouseX - ttWidth - 14 : mouseX + 16;
    const posY = mouseY + ttHeight + 20 > rect.height ? mouseY - ttHeight - 14 : mouseY + 16;

    setTooltip({
      visible: true,
      x: Math.max(12, posX),
      y: Math.max(12, posY),
      feature: feat,
    });
  };

  // Helper to determine the top deficit bottleneck for the hover card
  const getTopDeficit = (p: any): string => {
    if ((p.Percent_Schools_Computer_Lab ?? 100) < 18) {
      return `Severe Digital Gap: ${(p.Percent_Schools_Computer_Lab ?? 0).toFixed(1)}% Labs`;
    }
    if ((p.Dropout_Rate_Secondary ?? 0) > 30) {
      return `Elevated Dropout: ${(p.Dropout_Rate_Secondary ?? 0).toFixed(1)}% Attrition`;
    }
    if ((p.Percent_Schools_Electricity ?? 100) < 58) {
      return `Power Deficit: ${(p.Percent_Schools_Electricity ?? 0).toFixed(1)}% Electrified`;
    }
    if ((p.Percent_Schools_Toilets ?? 100) < 55) {
      return `WASH Deficit: ${(p.Percent_Schools_Toilets ?? 0).toFixed(1)}% Functional Toilets`;
    }
    if ((p.Pupil_Teacher_Ratio_Secondary ?? 0) > 42) {
      return `PTR Stress: ${(p.Pupil_Teacher_Ratio_Secondary ?? 0).toFixed(1)}:1 Ratio`;
    }
    return `Baseline Need: ${(100 - (p.Literacy_Rate_Total ?? 70)).toFixed(1)}% Literacy Deficit`;
  };

  return (
    <div
      ref={containerRef}
      className="dossier-card relative w-full h-[580px] overflow-hidden flex flex-col select-none border border-slate-700/60 shadow-2xl"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(20, 184, 166, 0.08) 0%, #061014 100%)',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setTooltip((t) => ({ ...t, visible: false }));
      }}
    >
      {/* Top Left Navigation Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#09151C]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-xl">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
            Madhya Pradesh GIS Grid
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700 mx-1.5" />
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.35, 3.5))}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-transparent hover:border-slate-700 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.35, 0.7))}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-transparent hover:border-slate-700 cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Map View"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-transparent hover:border-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Center Legend Strip */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#09151C]/92 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-3.5 whitespace-nowrap pointer-events-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Risk Stratification:</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#be123c] shadow-[0_0_6px_rgba(190,18,60,0.8)]" />
            <span className="font-semibold text-slate-200">High Risk</span>
            <span className="text-[10px] text-slate-400 font-mono">&gt;50</span>
          </div>
          <div className="h-3 w-px bg-slate-700/80" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] shadow-[0_0_6px_rgba(180,83,9,0.8)]" />
            <span className="font-semibold text-slate-200">Medium</span>
            <span className="text-[10px] text-slate-400 font-mono">35-50</span>
          </div>
          <div className="h-3 w-px bg-slate-700/80" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e] shadow-[0_0_6px_rgba(15,118,110,0.8)]" />
            <span className="font-semibold text-slate-200">Low Risk</span>
            <span className="text-[10px] text-slate-400 font-mono">&lt;35</span>
          </div>
        </div>
      </div>

      {/* Main SVG Vector Map */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {projectedFeatures.map((item) => {
            const isSelected = selectedDistrict === item.name;
            const isDimmed = riskFilter !== 'ALL' && item.risk !== riskFilter;

            return (
              <g key={item.name} className="district-group">
                <path
                  d={item.path || ''}
                  fill={item.color}
                  className={`district-path ${isSelected ? 'selected' : ''} ${
                    isDimmed ? 'dimmed' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDistrict(item.name);
                  }}
                  onMouseEnter={(e) => updateTooltipPosition(e, item.feature)}
                  onMouseMove={(e) => updateTooltipPosition(e, item.feature)}
                  onMouseLeave={() => {
                    setTooltip((t) => ({ ...t, visible: false }));
                  }}
                />

                {/* Subtle, high-contrast labels rendered only on key centroids when zoomed in */}
                {item.centroid && zoom > 1.35 && (
                  <text
                    x={item.centroid[0]}
                    y={item.centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    pointerEvents="none"
                    className="font-semibold fill-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tight select-none"
                    style={{
                      opacity: isDimmed ? 0.2 : 0.85,
                      fontSize: `${Math.max(8, 10 / zoom)}px`,
                    }}
                  >
                    {item.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip - High-Contrast Glassmorphic Pill */}
      {tooltip.visible && tooltip.feature && (
        <div
          className="absolute pointer-events-none z-50 bg-[#061014]/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-3.5 rounded-2xl min-w-[230px] transition-all duration-75 ease-out"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <h4 className="text-sm font-black text-white">
              {tooltip.feature.properties.matchedName || tooltip.feature.properties.District}
            </h4>
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap inline-flex items-center gap-1.5 ${
                getRiskCategory(tooltip.feature.properties.Learning_Poverty_Score) === 'High Risk'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                  : getRiskCategory(tooltip.feature.properties.Learning_Poverty_Score) ===
                    'Medium Risk'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  getRiskCategory(tooltip.feature.properties.Learning_Poverty_Score) === 'High Risk'
                    ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-pulse'
                    : getRiskCategory(tooltip.feature.properties.Learning_Poverty_Score) === 'Medium Risk'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              {getRiskCategory(tooltip.feature.properties.Learning_Poverty_Score)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mt-2.5">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Unified LPI Score
              </span>
              <span className="font-mono font-bold text-teal-400 text-sm">
                {tooltip.feature.properties.Learning_Poverty_Score?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Sec. Dropout
              </span>
              <span className="font-mono font-bold text-slate-100 text-sm">
                {tooltip.feature.properties.Dropout_Rate_Secondary?.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Top Deficit Bottleneck Indicator */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{getTopDeficit(tooltip.feature.properties)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapViewer;
