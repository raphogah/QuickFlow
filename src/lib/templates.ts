import * as XLSX from 'xlsx';
import { CanonicalProductionRow } from '../types';

export const CSV_TEMPLATE_HEADERS = [
  'date',
  'well_id',
  'oil_rate',
  'water_rate',
  'gas_rate',
  'pressure',
  'bhp',
  'gor',
  'temperature',
  'porosity',
  'permeability',
  'net_pay',
  'x',
  'y'
];

export function generateCSVTemplateContent(): string {
  const sampleRows = [
    '# QuickFlow AI V1 Production History Dataset Template',
    '# Required: date (YYYY-MM-DD), well_id (string), oil_rate (BOPD)',
    '# Optional: water_rate (BWPD), gas_rate (MSCFD), pressure (psia), bhp (psia), gor (scf/stb), temperature (deg F), porosity (0-1 fraction), permeability (mD), net_pay (ft), x, y',
    CSV_TEMPLATE_HEADERS.join(','),
    '2022-01-01,WELL-01,4500,210,1850,3850,3120,411,185,0.22,145,65,582400,6421000',
    '2022-02-01,WELL-01,4380,245,1810,3810,3090,413,185,0.22,145,65,582400,6421000',
    '2022-03-01,WELL-01,4240,290,1780,3780,3050,420,185,0.22,145,65,582400,6421000',
    '2022-01-01,WELL-02,3800,150,1420,3890,3180,374,188,0.19,95,50,583100,6421800',
    '2022-02-01,WELL-02,3690,180,1390,3840,3140,377,188,0.19,95,50,583100,6421800',
    '2022-03-01,WELL-02,3570,220,1360,3800,3110,381,188,0.19,95,50,583100,6421800',
  ];
  return sampleRows.join('\n');
}

export function downloadCSVTemplate(filename: string = 'quickflow_production_template.csv') {
  const content = generateCSVTemplateContent();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadXLSXTemplate(filename: string = 'quickflow_production_template.xlsx') {
  const data = [
    {
      date: '2022-01-01',
      well_id: 'WELL-01',
      oil_rate: 4500,
      water_rate: 210,
      gas_rate: 1850,
      pressure: 3850,
      bhp: 3120,
      gor: 411,
      temperature: 185,
      porosity: 0.22,
      permeability: 145,
      net_pay: 65,
      x: 582400,
      y: 6421000
    },
    {
      date: '2022-02-01',
      well_id: 'WELL-01',
      oil_rate: 4380,
      water_rate: 245,
      gas_rate: 1810,
      pressure: 3810,
      bhp: 3090,
      gor: 413,
      temperature: 185,
      porosity: 0.22,
      permeability: 145,
      net_pay: 65,
      x: 582400,
      y: 6421000
    },
    {
      date: '2022-03-01',
      well_id: 'WELL-01',
      oil_rate: 4240,
      water_rate: 290,
      gas_rate: 1780,
      pressure: 3780,
      bhp: 3050,
      gor: 420,
      temperature: 185,
      porosity: 0.22,
      permeability: 145,
      net_pay: 65,
      x: 582400,
      y: 6421000
    },
    {
      date: '2022-01-01',
      well_id: 'WELL-02',
      oil_rate: 3800,
      water_rate: 150,
      gas_rate: 1420,
      pressure: 3890,
      bhp: 3180,
      gor: 374,
      temperature: 188,
      porosity: 0.19,
      permeability: 95,
      net_pay: 50,
      x: 583100,
      y: 6421800
    },
    {
      date: '2022-02-01',
      well_id: 'WELL-02',
      oil_rate: 3690,
      water_rate: 180,
      gas_rate: 1390,
      pressure: 3840,
      bhp: 3140,
      gor: 377,
      temperature: 188,
      porosity: 0.19,
      permeability: 95,
      net_pay: 50,
      x: 583100,
      y: 6421800
    },
    {
      date: '2022-03-01',
      well_id: 'WELL-02',
      oil_rate: 3570,
      water_rate: 220,
      gas_rate: 1360,
      pressure: 3800,
      bhp: 3110,
      gor: 381,
      temperature: 188,
      porosity: 0.19,
      permeability: 95,
      net_pay: 50,
      x: 583100,
      y: 6421800
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Data');
  
  // Also add a README / Data Dictionary sheet
  const dictData = [
    { Field: 'date', Required: 'YES', Type: 'YYYY-MM-DD', Description: 'Monthly or daily production timestamp' },
    { Field: 'well_id', Required: 'YES', Type: 'String', Description: 'Unique well identifier (e.g. WELL-01, API-42-123)' },
    { Field: 'oil_rate', Required: 'YES', Type: 'Float (>= 0)', Description: 'Daily average oil production rate in BOPD (STB/day)' },
    { Field: 'water_rate', Required: 'NO', Type: 'Float (>= 0)', Description: 'Daily average water production in BWPD' },
    { Field: 'gas_rate', Required: 'NO', Type: 'Float (>= 0)', Description: 'Daily average gas production in MSCFD' },
    { Field: 'pressure', Required: 'NO', Type: 'Float', Description: 'Static average reservoir pressure in psia' },
    { Field: 'bhp', Required: 'NO', Type: 'Float', Description: 'Flowing bottom-hole pressure in psia' },
    { Field: 'gor', Required: 'NO', Type: 'Float', Description: 'Gas-oil ratio in scf/stb' },
    { Field: 'porosity', Required: 'NO', Type: 'Float (0.0 to 1.0)', Description: 'Matrix porosity fraction' },
    { Field: 'permeability', Required: 'NO', Type: 'Float (> 0)', Description: 'Absolute permeability in milliDarcies (mD)' },
    { Field: 'net_pay', Required: 'NO', Type: 'Float (> 0)', Description: 'Net hydrocarbon pay thickness in feet (ft)' },
  ];
  const dictSheet = XLSX.utils.json_to_sheet(dictData);
  XLSX.utils.book_append_sheet(workbook, dictSheet, 'Column_Dictionary');

  XLSX.writeFile(workbook, filename);
}

// Generate rich sample realistic multi-well production history
export function generateSampleDataset(reservoirName: string, fluidType: string): CanonicalProductionRow[] {
  const rows: CanonicalProductionRow[] = [];
  const wellCount = 4;
  const months = 36; // 3 years historical
  const startDate = new Date('2021-01-01');

  const wells = [
    { id: 'PROD-A01', initRate: 5400, bFactor: 0.6, di: 0.18, poro: 0.23, perm: 180, pay: 75, x: 582100, y: 6420800 },
    { id: 'PROD-A02', initRate: 4800, bFactor: 0.5, di: 0.15, poro: 0.21, perm: 140, pay: 65, x: 583400, y: 6421500 },
    { id: 'PROD-A03', initRate: 6200, bFactor: 0.7, di: 0.22, poro: 0.26, perm: 240, pay: 90, x: 581900, y: 6422800 },
    { id: 'PROD-A04', initRate: 3900, bFactor: 0.45, di: 0.14, poro: 0.18, perm: 85, pay: 45, x: 584200, y: 6420100 },
  ];

  for (let m = 0; m < months; m++) {
    const curDate = new Date(startDate);
    curDate.setMonth(curDate.getMonth() + m);
    const dateStr = curDate.toISOString().slice(0, 7) + '-01';
    const tYears = m / 12.0;

    wells.forEach(w => {
      // Hyperbolic decline with small realistic noise
      const noise = 1 + (Math.sin(m * 1.7 + w.initRate) * 0.04);
      const qOil = Math.round((w.initRate / Math.pow(1 + w.bFactor * w.di * tYears, 1 / w.bFactor)) * noise);
      
      // Water cut breakthrough trajectory
      const waterRatio = Math.min(0.75, 0.04 + (0.65 * (m / months) * (m / months)));
      const qWater = Math.round(qOil * (waterRatio / (1 - waterRatio)));
      
      // Gas rate with increasing GOR
      const gor = 420 + Math.round(m * 12);
      const qGas = Math.round((qOil * gor) / 1000);

      // Pressure depletion
      const pressure = Math.round(4150 - (m * 22) + Math.sin(m) * 15);
      const bhp = Math.round(pressure * 0.78);

      rows.push({
        date: dateStr,
        well_id: w.id,
        oil_rate: Math.max(20, qOil),
        water_rate: qWater,
        gas_rate: qGas,
        pressure,
        bhp,
        gor,
        temperature: 190,
        porosity: w.poro,
        permeability: w.perm,
        net_pay: w.pay,
        x: w.x,
        y: w.y,
      });
    });
  }

  return rows;
}
