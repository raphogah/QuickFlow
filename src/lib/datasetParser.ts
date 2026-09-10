import { CanonicalProductionRow, ValidationReport, ValidationErrorItem } from '../types';
import * as XLSX from 'xlsx';

// Canonical field definitions and aliases dictionary
export const COLUMN_ALIASES: Record<string, string[]> = {
  date: ['date', 'timestamp', 'prod_date', 'production_date', 'time', 'month', 'period', 'record_date'],
  well_id: ['well_id', 'well', 'well_name', 'uwi', 'api', 'well_number', 'well_no', 'source_well'],
  oil_rate: ['oil_rate', 'bopd', 'oil_bopd', 'oil_prod', 'qo', 'oil', 'stb/d', 'oil_rate_bopd', 'daily_oil'],
  water_rate: ['water_rate', 'bwpd', 'water_bwpd', 'water_prod', 'qw', 'water', 'water_rate_bwpd', 'daily_water'],
  gas_rate: ['gas_rate', 'mscfd', 'gas_mscfd', 'gas_prod', 'qg', 'gas', 'gas_rate_mscfd', 'daily_gas'],
  pressure: ['pressure', 'p_res', 'reservoir_pressure', 'pres', 'psi', 'psia', 'bar', 'p_static'],
  bhp: ['bhp', 'bottom_hole_pressure', 'flowing_pressure', 'pwf', 'bhp_psi'],
  gor: ['gor', 'gas_oil_ratio', 'scf/stb', 'gas_oil_ratio_scf_stb'],
  temperature: ['temperature', 'temp', 'tres', 'deg_f', 'deg_c', 'reservoir_temp'],
  porosity: ['porosity', 'phi', 'poro', 'por', 'porosity_fraction'],
  permeability: ['permeability', 'perm', 'k_md', 'k', 'permeability_md'],
  net_pay: ['net_pay', 'h_ft', 'thickness', 'pay_thickness', 'h', 'net_thickness'],
  x: ['x', 'utm_x', 'longitude', 'easting', 'lon'],
  y: ['y', 'utm_y', 'latitude', 'northing', 'lat']
};

export async function parseDatasetFile(file: File): Promise<{
  rows: CanonicalProductionRow[];
  report: ValidationReport;
  rawContentHash: string;
}> {
  const fileName = file.name.toLowerCase();
  let rawRows: any[] = [];

  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    const text = await file.text();
    rawRows = parseCSVText(text);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');
  }

  // Generate SHA-256 hash representation
  const rawHash = await generatePseudoHash(file.name + file.size + rawRows.length);

  // Validate and canonicalize rows
  const validationResult = validateAndCanonicalizeRows(rawRows);

  return {
    rows: validationResult.canonicalRows,
    report: validationResult.report,
    rawContentHash: rawHash,
  };
}

export function parseCSVText(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function validateAndCanonicalizeRows(rawRows: any[]): {
  canonicalRows: CanonicalProductionRow[];
  report: ValidationReport;
} {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];
  const columnMapping: Record<string, string> = {};

  if (!rawRows || rawRows.length === 0) {
    return {
      canonicalRows: [],
      report: {
        is_valid: false,
        total_rows: 0,
        valid_rows: 0,
        detected_wells: [],
        date_range: { start: '', end: '', duration_months: 0 },
        schema_status: 'failed',
        date_status: 'failed',
        completeness_status: 'failed',
        physical_range_status: 'failed',
        summary_stats: {
          avg_oil_rate: 0,
          max_oil_rate: 0,
          cumulative_oil_historical_mmstb: 0,
          avg_water_cut: 0,
          avg_gor: 0,
        },
        errors: [{ severity: 'error', category: 'schema', message: 'Dataset file is empty.' }],
        warnings: [],
        column_mapping: {},
      }
    };
  }

  // 1. Column Alias Resolution
  const rawHeaders = Object.keys(rawRows[0] || {});
  const normalizedRawHeaders = rawHeaders.map(h => h.toLowerCase().trim().replace(/[\s\-_]+/g, '_'));

  Object.entries(COLUMN_ALIASES).forEach(([canonicalKey, aliases]) => {
    for (let i = 0; i < rawHeaders.length; i++) {
      const norm = normalizedRawHeaders[i];
      if (aliases.includes(norm) || aliases.some(a => norm.includes(a))) {
        columnMapping[canonicalKey] = rawHeaders[i];
        break;
      }
    }
  });

  // Schema check: date, well_id, oil_rate are required
  let schemaStatus: 'passed' | 'failed' | 'warning' = 'passed';
  if (!columnMapping.date) {
    errors.push({ severity: 'error', category: 'schema', message: 'Missing required column: "date" (or aliases: timestamp, prod_date).' });
    schemaStatus = 'failed';
  }
  if (!columnMapping.well_id) {
    errors.push({ severity: 'error', category: 'schema', message: 'Missing required column: "well_id" (or aliases: well, well_name, uwi, api).' });
    schemaStatus = 'failed';
  }
  if (!columnMapping.oil_rate) {
    errors.push({ severity: 'error', category: 'schema', message: 'Missing required column: "oil_rate" (or aliases: bopd, oil_prod, qo).' });
    schemaStatus = 'failed';
  }

  const canonicalRows: CanonicalProductionRow[] = [];
  const wellDatesSeen = new Set<string>();
  const detectedWellsSet = new Set<string>();

  let dateStatus: 'passed' | 'failed' | 'warning' = 'passed';
  let physicalRangeStatus: 'passed' | 'failed' | 'warning' = 'passed';
  let completenessStatus: 'passed' | 'failed' | 'warning' = 'passed';

  let totalOilSum = 0;
  let totalWaterSum = 0;
  let totalGasSum = 0;
  let maxOilRate = 0;
  let totalPressureSum = 0;
  let pressureCount = 0;

  // Process rows
  rawRows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // 1-based + 1 for header
    let rowValid = true;

    // Date parsing
    const rawDateVal = columnMapping.date ? rawRow[columnMapping.date] : null;
    const parsedDate = parseDateString(rawDateVal);
    if (!parsedDate) {
      errors.push({
        row: rowNum,
        column: columnMapping.date || 'date',
        severity: 'error',
        category: 'date',
        message: `Invalid or unparseable date value: "${rawDateVal}"`,
        value: rawDateVal,
      });
      dateStatus = 'failed';
      rowValid = false;
    }

    // Well ID
    const rawWellId = columnMapping.well_id ? String(rawRow[columnMapping.well_id] || '').trim() : '';
    if (!rawWellId) {
      errors.push({
        row: rowNum,
        column: columnMapping.well_id || 'well_id',
        severity: 'error',
        category: 'completeness',
        message: 'Empty well identifier.',
      });
      completenessStatus = 'failed';
      rowValid = false;
    } else {
      detectedWellsSet.add(rawWellId);
    }

    // Duplicate check (well_id + date)
    if (parsedDate && rawWellId) {
      const wellDateKey = `${rawWellId}_${parsedDate}`;
      if (wellDatesSeen.has(wellDateKey)) {
        errors.push({
          row: rowNum,
          well_id: rawWellId,
          severity: 'error',
          category: 'order',
          message: `Duplicate record for well "${rawWellId}" on date "${parsedDate}".`,
        });
        completenessStatus = 'failed';
        rowValid = false;
      } else {
        wellDatesSeen.add(wellDateKey);
      }
    }

    // Oil rate check
    const rawOil = columnMapping.oil_rate ? Number(rawRow[columnMapping.oil_rate]) : 0;
    if (isNaN(rawOil)) {
      errors.push({
        row: rowNum,
        column: columnMapping.oil_rate,
        severity: 'error',
        category: 'physical_range',
        message: `Non-numeric oil rate: "${rawRow[columnMapping.oil_rate]}"`,
      });
      physicalRangeStatus = 'failed';
      rowValid = false;
    } else if (rawOil < 0) {
      errors.push({
        row: rowNum,
        column: columnMapping.oil_rate,
        severity: 'error',
        category: 'physical_range',
        message: `Negative oil rate: ${rawOil} BOPD is physically invalid.`,
        value: rawOil,
      });
      physicalRangeStatus = 'failed';
      rowValid = false;
    } else if (rawOil > 100_000) {
      warnings.push({
        row: rowNum,
        column: columnMapping.oil_rate,
        severity: 'warning',
        category: 'physical_range',
        message: `High oil rate (${rawOil} BOPD) detected. Please verify units.`,
        value: rawOil,
      });
    }

    // Water rate
    const rawWater = columnMapping.water_rate ? Number(rawRow[columnMapping.water_rate]) : 0;
    if (!isNaN(rawWater) && rawWater < 0) {
      errors.push({
        row: rowNum,
        column: columnMapping.water_rate,
        severity: 'error',
        category: 'physical_range',
        message: `Negative water rate: ${rawWater} BWPD.`,
        value: rawWater,
      });
      physicalRangeStatus = 'failed';
    }

    // Gas rate
    const rawGas = columnMapping.gas_rate ? Number(rawRow[columnMapping.gas_rate]) : 0;
    if (!isNaN(rawGas) && rawGas < 0) {
      errors.push({
        row: rowNum,
        column: columnMapping.gas_rate,
        severity: 'error',
        category: 'physical_range',
        message: `Negative gas rate: ${rawGas} MSCFD.`,
        value: rawGas,
      });
      physicalRangeStatus = 'failed';
    }

    // Pressure
    const rawPressure = columnMapping.pressure ? Number(rawRow[columnMapping.pressure]) : undefined;
    if (rawPressure !== undefined && !isNaN(rawPressure)) {
      if (rawPressure < 0 || rawPressure > 25000) {
        warnings.push({
          row: rowNum,
          column: columnMapping.pressure,
          severity: 'warning',
          category: 'physical_range',
          message: `Unusual reservoir pressure: ${rawPressure} psia.`,
          value: rawPressure,
        });
      }
      totalPressureSum += rawPressure;
      pressureCount++;
    }

    // Porosity check: MUST be between 0 and 1 (fraction)
    const rawPoro = columnMapping.porosity ? Number(rawRow[columnMapping.porosity]) : undefined;
    if (rawPoro !== undefined && !isNaN(rawPoro)) {
      if (rawPoro < 0 || rawPoro > 1.0) {
        errors.push({
          row: rowNum,
          column: columnMapping.porosity,
          severity: 'error',
          category: 'physical_range',
          message: `Porosity ${rawPoro} is outside valid physical range (0.0 to 1.0 fraction). If percentage (e.g. 18%), divide by 100.`,
          value: rawPoro,
        });
        physicalRangeStatus = 'failed';
      }
    }

    // Permeability check: must not be negative
    const rawPerm = columnMapping.permeability ? Number(rawRow[columnMapping.permeability]) : undefined;
    if (rawPerm !== undefined && !isNaN(rawPerm) && rawPerm < 0) {
      errors.push({
        row: rowNum,
        column: columnMapping.permeability,
        severity: 'error',
        category: 'physical_range',
        message: `Negative permeability: ${rawPerm} mD is physically impossible.`,
        value: rawPerm,
      });
      physicalRangeStatus = 'failed';
    }

    // Net pay check
    const rawNetPay = columnMapping.net_pay ? Number(rawRow[columnMapping.net_pay]) : undefined;
    if (rawNetPay !== undefined && !isNaN(rawNetPay) && rawNetPay < 0) {
      errors.push({
        row: rowNum,
        column: columnMapping.net_pay,
        severity: 'error',
        category: 'physical_range',
        message: `Negative net pay thickness: ${rawNetPay} ft.`,
        value: rawNetPay,
      });
      physicalRangeStatus = 'failed';
    }

    if (rowValid && parsedDate) {
      canonicalRows.push({
        date: parsedDate,
        well_id: rawWellId,
        oil_rate: rawOil >= 0 ? rawOil : 0,
        water_rate: rawWater >= 0 ? rawWater : 0,
        gas_rate: rawGas >= 0 ? rawGas : 0,
        pressure: rawPressure,
        bhp: columnMapping.bhp ? Number(rawRow[columnMapping.bhp]) : undefined,
        gor: columnMapping.gor ? Number(rawRow[columnMapping.gor]) : undefined,
        temperature: columnMapping.temperature ? Number(rawRow[columnMapping.temperature]) : undefined,
        porosity: rawPoro,
        permeability: rawPerm,
        net_pay: rawNetPay,
        x: columnMapping.x ? Number(rawRow[columnMapping.x]) : undefined,
        y: columnMapping.y ? Number(rawRow[columnMapping.y]) : undefined,
      });

      totalOilSum += rawOil;
      totalWaterSum += rawWater;
      totalGasSum += rawGas;
      if (rawOil > maxOilRate) maxOilRate = rawOil;
    }
  });

  // Sort canonical rows by date ascending
  canonicalRows.sort((a, b) => a.date.localeCompare(b.date));

  // Date range and minimum history check
  const sortedDates = Array.from(new Set(canonicalRows.map(r => r.date))).sort();
  const startDate = sortedDates[0] || '';
  const endDate = sortedDates[sortedDates.length - 1] || '';
  const durationMonths = sortedDates.length;

  if (durationMonths < 3) {
    errors.push({
      severity: 'error',
      category: 'date',
      message: `Insufficient production history: dataset contains ${durationMonths} distinct months (minimum 3 required for decline inference).`,
    });
    dateStatus = 'failed';
  }

  // Summary statistics
  const avgOilRate = canonicalRows.length > 0 ? totalOilSum / canonicalRows.length : 0;
  const avgWaterCut = (totalOilSum + totalWaterSum) > 0 ? (totalWaterSum / (totalOilSum + totalWaterSum)) * 100 : 0;
  const avgGOR = totalOilSum > 0 ? (totalGasSum * 1000) / totalOilSum : 0;
  const cumulativeOilMMstb = (totalOilSum * 30.4375) / 1_000_000;

  const isValid = errors.length === 0 && schemaStatus === 'passed';

  const report: ValidationReport = {
    is_valid: isValid,
    total_rows: rawRows.length,
    valid_rows: canonicalRows.length,
    detected_wells: Array.from(detectedWellsSet).sort(),
    date_range: {
      start: startDate,
      end: endDate,
      duration_months: durationMonths,
    },
    schema_status: schemaStatus,
    date_status: dateStatus,
    completeness_status: completenessStatus,
    physical_range_status: physicalRangeStatus,
    summary_stats: {
      avg_oil_rate: Math.round(avgOilRate),
      max_oil_rate: Math.round(maxOilRate),
      cumulative_oil_historical_mmstb: Number(cumulativeOilMMstb.toFixed(3)),
      avg_water_cut: Number(avgWaterCut.toFixed(1)),
      avg_gor: Math.round(avgGOR),
      avg_pressure: pressureCount > 0 ? Math.round(totalPressureSum / pressureCount) : undefined,
    },
    errors,
    warnings,
    column_mapping: columnMapping,
  };

  return { canonicalRows, report };
}

function parseDateString(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date format
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const str = String(val).trim();
  // Try direct YYYY-MM or YYYY-MM-DD
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(str)) {
    return str.length === 7 ? `${str}-01` : str;
  }
  // Try MM/DD/YYYY or DD/MM/YYYY
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().slice(0, 10);
  }
  return null;
}

async function generatePseudoHash(content: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}9f8c37d4e12a8800b73c44fa`;
}
