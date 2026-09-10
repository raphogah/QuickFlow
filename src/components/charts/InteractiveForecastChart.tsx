import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { ForecastDataPoint, ConfidenceBandType } from '../../types';
import { Layers, Eye, TrendingDown, Gauge, BarChart2 } from 'lucide-react';

interface Props {
  data: ForecastDataPoint[];
  confidenceBandType: ConfidenceBandType;
  showArps: boolean;
  stoiipMmstb?: number;
  height?: number;
  wellName?: string;
}

export function InteractiveForecastChart({
  data,
  confidenceBandType,
  showArps,
  stoiipMmstb,
  height = 420,
  wellName
}: Props) {
  const [activeTab, setActiveTab] = useState<'rate' | 'cumulative' | 'pressure' | 'all'>('rate');
  const [showConfidence, setShowConfidence] = useState(true);
  const [showDCA, setShowDCA] = useState(showArps);
  const [timeFilter, setTimeFilter] = useState<'all' | 'historical' | 'forecast'>('all');

  // Filter data according to time slice
  const filteredData = React.useMemo(() => {
    if (timeFilter === 'historical') return data.filter(d => d.is_historical);
    if (timeFilter === 'forecast') return data.filter(d => !d.is_historical);
    return data;
  }, [data, timeFilter]);

  // Downsample if more than 300 points for smooth render
  const chartData = React.useMemo(() => {
    if (filteredData.length <= 180) return filteredData;
    const step = Math.ceil(filteredData.length / 180);
    return filteredData.filter((_, idx) => idx % step === 0 || idx === filteredData.length - 1);
  }, [filteredData]);

  // Find transition date between historical and forecast
  const historicalEndIndex = data.findIndex(d => !d.is_historical);
  const splitDate = historicalEndIndex > 0 ? data[historicalEndIndex]?.date : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {wellName ? `Well Production Profile: ${wellName}` : 'Field-Level Production & Decline Trajectory'}
              <span className="text-xs px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono font-bold">
                PINN-Torch v1.4
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Physics-constrained forward integration with uncertainty propagation & material balance
            </p>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('rate')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'rate' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rate (BOPD)
            </button>
            <button
              onClick={() => setActiveTab('cumulative')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'cumulative' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cum. Np (MMstb)
            </button>
            <button
              onClick={() => setActiveTab('pressure')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'pressure' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pressure (psia)
            </button>
          </div>

          {/* Toggle Switches */}
          {activeTab === 'rate' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setShowConfidence(!showConfidence)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${showConfidence ? 'text-teal-700 font-bold' : 'text-slate-400'}`}
                title="Toggle P10/P90 Confidence Band"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>P10/P90</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setShowDCA(!showDCA)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${showDCA ? 'text-amber-700 font-bold' : 'text-slate-400'}`}
                title="Toggle Arps DCA Baseline"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Arps DCA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Recharts Canvas */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="rateBandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cumNpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

            <XAxis 
              dataKey="date" 
              stroke="#94A3B8" 
              fontSize={11}
              tickFormatter={(val) => {
                const parts = val.split('-');
                return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : val;
              }}
              minTickGap={35}
            />

            {/* Left Y Axis for Rates or Cumulative or Pressure */}
            {activeTab === 'rate' && (
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                label={{ value: 'Oil Production Rate (BOPD)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dy: 60 }}
              />
            )}

            {activeTab === 'cumulative' && (
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11}
                tickFormatter={(val) => `${val.toFixed(1)} M`}
                label={{ value: 'Cumulative Production Np (MMstb)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dy: 70 }}
              />
            )}

            {activeTab === 'pressure' && (
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11}
                domain={['dataMin - 200', 'dataMax + 200']}
                label={{ value: 'Reservoir Pressure (psia)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dy: 60 }}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0]?.payload as ForecastDataPoint;
                return (
                  <div className="bg-white/95 border border-slate-200 rounded-lg p-3 shadow-xl backdrop-blur text-xs font-mono">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 gap-4">
                      <span className="font-bold text-slate-900">{label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-bold ${
                        point.is_historical 
                          ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {point.is_historical ? 'Historical' : 'Physics Forecast'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between gap-4 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                          <span>Oil Rate (P50):</span>
                        </span>
                        <span className="font-bold text-slate-900">{point.oil_rate_p50.toLocaleString()} BOPD</span>
                      </div>

                      {!point.is_historical && point.oil_rate_p10 && (
                        <div className="flex justify-between gap-4 text-slate-500">
                          <span>P10 (Optimistic):</span>
                          <span className="text-teal-700 font-semibold">{point.oil_rate_p10.toLocaleString()} BOPD</span>
                        </div>
                      )}

                      {!point.is_historical && point.oil_rate_p90 && (
                        <div className="flex justify-between gap-4 text-slate-500">
                          <span>P90 (Conservative):</span>
                          <span className="text-teal-700 font-semibold">{point.oil_rate_p90.toLocaleString()} BOPD</span>
                        </div>
                      )}

                      {point.arps_oil_rate && (
                        <div className="flex justify-between gap-4 text-amber-700">
                          <span>Arps DCA Baseline:</span>
                          <span className="font-semibold">{point.arps_oil_rate.toLocaleString()} BOPD</span>
                        </div>
                      )}

                      <div className="flex justify-between gap-4 text-sky-700 pt-1 border-t border-slate-100 font-semibold">
                        <span>Cumulative Np:</span>
                        <span>{point.cumulative_np_p50.toFixed(3)} MMstb</span>
                      </div>

                      {point.pressure_psia && (
                        <div className="flex justify-between gap-4 text-indigo-700">
                          <span>Pressure:</span>
                          <span>{point.pressure_psia} psia</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <Legend 
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
              formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
            />

            {/* Vertical Split Line for History vs Forecast */}
            {splitDate && (
              <ReferenceLine 
                x={splitDate} 
                stroke="#D97706" 
                strokeDasharray="4 4" 
                label={{ 
                  value: 'Forecast Origin (t₀)', 
                  position: 'top', 
                  fill: '#D97706', 
                  fontSize: 10,
                  fontWeight: 600
                }} 
              />
            )}

            {/* RATE VIEW RENDERING */}
            {activeTab === 'rate' && (
              <>
                {/* Confidence Envelope (P10 to P90) */}
                {showConfidence && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="oil_rate_p10" 
                      stroke="transparent" 
                      fill="url(#rateBandGradient)" 
                      name="P10-P90 Uncertainty Envelope" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="oil_rate_p90" 
                      stroke="#0D9488" 
                      strokeWidth={1} 
                      strokeDasharray="2 2" 
                      dot={false}
                      name="P90 Lower Bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="oil_rate_p10" 
                      stroke="#0D9488" 
                      strokeWidth={1} 
                      strokeDasharray="2 2" 
                      dot={false}
                      name="P10 Upper Bound"
                    />
                  </>
                )}

                {/* Arps DCA Curve */}
                {showDCA && (
                  <Line 
                    type="monotone" 
                    dataKey="arps_oil_rate" 
                    stroke="#D97706" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                    name="Arps DCA Benchmark"
                  />
                )}

                {/* Main P50 Rate Line */}
                <Line 
                  type="monotone" 
                  dataKey="oil_rate_p50" 
                  stroke="#0D9488" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
                  name="Oil Production Rate (P50)"
                />
              </>
            )}

            {/* CUMULATIVE NP VIEW */}
            {activeTab === 'cumulative' && (
              <>
                <Area 
                  type="monotone" 
                  dataKey="cumulative_np_p50" 
                  stroke="#2563EB" 
                  strokeWidth={2.5} 
                  fill="url(#cumNpGradient)" 
                  name="Cumulative Oil Np (MMstb)" 
                />

                {stoiipMmstb && (
                  <ReferenceLine 
                    y={stoiipMmstb * 0.5} 
                    stroke="#E11D48" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: `STOIIP Recovery Ceiling (${(stoiipMmstb * 0.5).toFixed(1)} MMstb)`, 
                      fill: '#E11D48', 
                      position: 'insideTopRight',
                      fontSize: 11
                    }} 
                  />
                )}
              </>
            )}

            {/* PRESSURE VIEW */}
            {activeTab === 'pressure' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="pressure_psia" 
                  stroke="#7C3AED" 
                  strokeWidth={2.5} 
                  dot={false}
                  name="Simulated Reservoir Pressure (psia)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="material_balance_pressure" 
                  stroke="#DB2777" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={false}
                  name="Material Balance Minimum (psia)" 
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Diagnostics */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>PyTorch PINN Neural ODE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Arps Hyperbolic Decline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Cumulative Trapezoidal Integration</span>
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Physics Invariants: dNp/dt ≥ 0 &bull; Np ≤ STOIIP &bull; Havlena-Odeh P(t)
        </div>
      </div>
    </div>
  );
}
