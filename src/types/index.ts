// QuickFlow AI V1 - Core TypeScript Domain Types & Entities

export type UserRole = 'Admin' | 'Engineer' | 'Viewer';

export type FluidType = 
  | 'Black Oil'
  | 'Volatile Oil'
  | 'Gas Condensate'
  | 'Dry Gas'
  | 'Heavy Oil';

export type DriveMechanism = 
  | 'Solution Gas Drive'
  | 'Gas Cap Expansion'
  | 'Water Drive'
  | 'Gravity Drainage'
  | 'Combination Drive'
  | 'Compaction Drive';

export type ForecastHorizonYears = 10 | 25 | 50 | 100;
export type ForecastInterval = 'monthly' | 'quarterly' | 'yearly';
export type ConfidenceBandType = 'P10_P50_P90' | 'P5_P50_P95' | 'P50_ONLY';
export type ArpsDeclineType = 'exponential' | 'harmonic' | 'hyperbolic' | 'none';
export type PhysicsConstraintMode = 'full' | 'monotonicity_only' | 'unconstrained_experimental';

export type JobStatus = 'Queued' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';
export type JobStage = 
  | 'validate'
  | 'preprocess'
  | 'inference'
  | 'uncertainty'
  | 'physics_audit'
  | 'persist'
  | 'report';

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
  tier: 'Enterprise' | 'Professional' | 'Standard';
  max_reservoirs: number;
  consent_model_training: boolean;
  created_at: string;
  storage_quota_mb: number;
  storage_used_mb: number;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  email_verified: boolean;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
  is_active: boolean;
}

export interface Reservoir {
  id: string;
  company_id: string;
  name: string;
  field_name: string;
  country: string;
  location: string;
  fluid_type: FluidType;
  drive_mechanism: DriveMechanism;
  production_start_date: string;
  initial_pressure: number; // psia
  stoiip_mmstb: number; // Million Stock Tank Barrels
  producers_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
}

export interface Well {
  id: string;
  company_id: string;
  reservoir_id: string;
  well_id: string;
  name: string;
  x: number;
  y: number;
  net_pay: number; // ft
  porosity: number; // fraction 0-1
  permeability: number; // mD
  status: 'Active' | 'Shut-in' | 'Suspended';
  created_at: string;
}

export interface CanonicalProductionRow {
  date: string; // YYYY-MM-DD
  well_id: string;
  oil_rate: number; // BOPD (bbl/day)
  water_rate: number; // BWPD
  gas_rate: number; // MSCFD
  pressure?: number; // psia
  bhp?: number; // psia
  gor?: number; // scf/stb
  temperature?: number; // deg F
  porosity?: number; // 0-1
  permeability?: number; // mD
  net_pay?: number; // ft
  x?: number;
  y?: number;
}

export interface ValidationErrorItem {
  row?: number;
  well_id?: string;
  column?: string;
  severity: 'error' | 'warning';
  category: 'schema' | 'date' | 'completeness' | 'physical_range' | 'order';
  message: string;
  value?: any;
}

export interface ValidationReport {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  detected_wells: string[];
  date_range: {
    start: string;
    end: string;
    duration_months: number;
  };
  schema_status: 'passed' | 'failed' | 'warning';
  date_status: 'passed' | 'failed' | 'warning';
  completeness_status: 'passed' | 'failed' | 'warning';
  physical_range_status: 'passed' | 'failed' | 'warning';
  summary_stats: {
    avg_oil_rate: number;
    max_oil_rate: number;
    cumulative_oil_historical_mmstb: number;
    avg_water_cut: number;
    avg_gor: number;
    avg_pressure?: number;
  };
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  column_mapping: Record<string, string>;
}

export interface Dataset {
  id: string;
  company_id: string;
  reservoir_id: string;
  name: string;
  version: number;
  file_name: string;
  file_size_bytes: number;
  sha256_hash: string;
  storage_path: string;
  rows_count: number;
  detected_wells: string[];
  date_range: {
    start: string;
    end: string;
  };
  validation_report: ValidationReport;
  status: 'valid' | 'invalid' | 'warning';
  created_by_user_id: string;
  created_at: string;
  rows_sample: CanonicalProductionRow[];
}

export interface ForecastParams {
  horizon_years: ForecastHorizonYears;
  interval: ForecastInterval;
  selected_wells: string[]; // empty means all reservoir wells
  confidence_bands: ConfidenceBandType;
  arps_baseline: ArpsDeclineType;
  physics_mode: PhysicsConstraintMode;
  custom_stoiip_mmstb?: number;
  initial_decline_rate_nominal?: number;
  hyperbolic_b_factor?: number;
}

export interface ForecastJob {
  id: string;
  company_id: string;
  reservoir_id: string;
  dataset_id: string;
  status: JobStatus;
  stage: JobStage;
  progress_pct: number;
  params: ForecastParams;
  model_version: string;
  model_name: string;
  model_hash: string;
  dataset_hash: string;
  requested_by_user_id: string;
  requested_by_user_name: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  stage_logs: Array<{
    stage: JobStage;
    timestamp: string;
    message: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
}

export interface ForecastDataPoint {
  date: string;
  is_historical: boolean;
  // Field-level rates
  oil_rate_p50: number;
  oil_rate_p10?: number;
  oil_rate_p90?: number;
  oil_rate_p5?: number;
  oil_rate_p95?: number;
  // DCA Baseline overlay
  arps_oil_rate?: number;
  // Cumulative oil production in MMstb
  cumulative_np_p50: number;
  cumulative_np_p10?: number;
  cumulative_np_p90?: number;
  // Reservoir pressure psia
  pressure_psia?: number;
  // Material balance theoretical limit
  material_balance_pressure?: number;
}

export interface WellForecastResult {
  well_id: string;
  eur_mmstb: number;
  terminal_rate_bopd: number;
  r2: number;
  smape: number;
  data_points: Array<{
    date: string;
    is_historical: boolean;
    oil_rate_p50: number;
    cumulative_np_p50: number;
    water_rate_p50: number;
    gas_rate_p50: number;
  }>;
}

export interface ArpsParams {
  qi_bopd: number;
  di_nominal_per_year: number;
  b_factor: number;
  decline_type: ArpsDeclineType;
  eur_arps_mmstb: number;
}

export interface PhysicsAuditResult {
  passed: boolean;
  monotonicity_violations: number;
  material_balance_result: 'PASS' | 'WARN' | 'FAIL';
  stoiip_bound_result: 'PASS' | 'EXCEEDED';
  stoiip_mmstb: number;
  final_np_mmstb: number;
  recovery_factor_pct: number;
  max_allowable_rf_pct: number;
  pressure_compliance_pct: number;
  details: string[];
}

export interface ForecastResult {
  id: string;
  company_id: string;
  job_id: string;
  reservoir_id: string;
  dataset_id: string;
  model_version: string;
  model_hash: string;
  dataset_hash: string;
  params: ForecastParams;
  kpis: {
    r2: number;
    smape: number;
    eur_mmstb: number; // Estimated Ultimate Recovery
    terminal_rate_bopd: number;
    historical_np_mmstb: number;
    forecast_np_mmstb: number;
    total_cumulative_np_mmstb: number;
    peak_rate_bopd: number;
  };
  physics_audit: PhysicsAuditResult;
  time_series: ForecastDataPoint[];
  per_well_results: Record<string, WellForecastResult>;
  arps_params: ArpsParams;
  completed_at: string;
  generated_reports: {
    csv_url: string;
    pdf_url: string;
    png_url: string;
  };
}

export interface ModelVersion {
  id: string;
  version_tag: string;
  model_name: string;
  description: string;
  sha256_hash: string;
  physics_engine: string;
  architecture: string;
  immutable_artifact_uri: string;
  input_features: string[];
  is_active: boolean;
  released_at: string;
}

export interface AuditEvent {
  id: string;
  company_id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  previous_hash: string;
  event_hash: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  company_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
}
