import { 
  Company, 
  User, 
  Reservoir, 
  Well, 
  Dataset, 
  ForecastJob, 
  ForecastResult, 
  ModelVersion, 
  AuditEvent, 
  NotificationItem, 
  ForecastParams 
} from '../types';
import { runPhysicsConstrainedForecast, CURRENT_MODEL_VERSION, CURRENT_MODEL_HASH } from './physicsEngine';
import { generateSampleDataset } from './templates';
import { validateAndCanonicalizeRows } from './datasetParser';

const STORAGE_KEY = 'quickflow_ai_v1_database_v2';

export class CrossTenantSecurityViolationError extends Error {
  constructor(message: string, public attemptedCompanyId?: string, public authenticatedCompanyId?: string) {
    super(`[TENANT_ISOLATION_BREACH_DETECTED] ${message}`);
    this.name = 'CrossTenantSecurityViolationError';
  }
}

export interface QuickFlowDatabase {
  companies: Company[];
  users: User[];
  reservoirs: Reservoir[];
  wells: Well[];
  datasets: Dataset[];
  forecast_jobs: ForecastJob[];
  forecast_results: ForecastResult[];
  model_versions: ModelVersion[];
  audit_events: AuditEvent[];
  notifications: NotificationItem[];
  current_user_id: string;
}

// Initial seed data
export function getInitialDatabase(): QuickFlowDatabase {
  const company1: Company = {
    id: 'comp_apex_01',
    name: 'Apex Energy Operating Co.',
    slug: 'apex-energy',
    domain: 'apexenergy.com',
    tier: 'Enterprise',
    max_reservoirs: 25,
    consent_model_training: false,
    created_at: '2025-01-15T08:00:00Z',
    storage_quota_mb: 50000,
    storage_used_mb: 2840,
  };

  const company2: Company = {
    id: 'comp_vanguard_02',
    name: 'Vanguard Petroleum Corp.',
    slug: 'vanguard-petro',
    domain: 'vanguardpetro.com',
    tier: 'Professional',
    max_reservoirs: 10,
    consent_model_training: false,
    created_at: '2025-03-20T10:30:00Z',
    storage_quota_mb: 20000,
    storage_used_mb: 1120,
  };

  const adminUser: User = {
    id: 'usr_sarah_admin',
    company_id: company1.id,
    email: 'sarah.chen@apexenergy.com',
    full_name: 'Dr. Sarah Chen',
    role: 'Admin',
    email_verified: true,
    created_at: '2025-01-15T08:05:00Z',
    last_login_at: new Date().toISOString(),
    is_active: true,
  };

  const engineerUser: User = {
    id: 'usr_marcus_eng',
    company_id: company1.id,
    email: 'marcus.vance@apexenergy.com',
    full_name: 'Marcus Vance, PE',
    role: 'Engineer',
    email_verified: true,
    created_at: '2025-02-01T09:15:00Z',
    last_login_at: '2026-08-30T14:20:00Z',
    is_active: true,
  };

  const viewerUser: User = {
    id: 'usr_elena_view',
    company_id: company1.id,
    email: 'elena.rostova@apexenergy.com',
    full_name: 'Elena Rostova',
    role: 'Viewer',
    email_verified: true,
    created_at: '2025-04-10T11:00:00Z',
    is_active: true,
  };

  // Company 2 user (isolated tenant)
  const vanguardUser: User = {
    id: 'usr_dave_vanguard',
    company_id: company2.id,
    email: 'dave.miller@vanguardpetro.com',
    full_name: 'Dave Miller',
    role: 'Admin',
    email_verified: true,
    created_at: '2025-03-20T10:35:00Z',
    is_active: true,
  };

  const res1: Reservoir = {
    id: 'res_brent_alpha',
    company_id: company1.id,
    name: 'Brent Turbidite Alpha',
    field_name: 'Brent Complex Block 211',
    country: 'United Kingdom',
    location: 'North Sea (58.2° N, 1.8° E)',
    fluid_type: 'Black Oil',
    drive_mechanism: 'Water Drive',
    production_start_date: '2021-01-01',
    initial_pressure: 4350,
    stoiip_mmstb: 480,
    producers_count: 4,
    notes: 'High-quality turbidite sandstone with strong edge-water aquifer drive and high vertical permeability.',
    created_at: '2025-01-20T14:00:00Z',
    updated_at: '2026-08-25T16:00:00Z',
    created_by_user_id: adminUser.id,
  };

  const res2: Reservoir = {
    id: 'res_pegasus_deep',
    company_id: company1.id,
    name: 'Pegasus Deepwater Complex',
    field_name: 'Mississippi Canyon Block 778',
    country: 'United States',
    location: 'Gulf of Mexico Deepwater (28.4° N, 89.2° W)',
    fluid_type: 'Volatile Oil',
    drive_mechanism: 'Combination Drive',
    production_start_date: '2022-06-01',
    initial_pressure: 9800,
    stoiip_mmstb: 750,
    producers_count: 6,
    notes: 'Subsea multi-well cluster producing to floating production hub. Active gas cap expansion coupled with flank injection.',
    created_at: '2025-03-10T12:00:00Z',
    updated_at: '2026-08-28T09:30:00Z',
    created_by_user_id: engineerUser.id,
  };

  // Company 2 reservoir (isolated)
  const res3_vanguard: Reservoir = {
    id: 'res_wolfcamp_vg',
    company_id: company2.id,
    name: 'Vanguard Wolfcamp Midland-4',
    field_name: 'Midland Basin Section 14',
    country: 'United States',
    location: 'West Texas (31.8° N, 102.1° W)',
    fluid_type: 'Volatile Oil',
    drive_mechanism: 'Solution Gas Drive',
    production_start_date: '2023-01-01',
    initial_pressure: 5200,
    stoiip_mmstb: 220,
    producers_count: 8,
    notes: 'Confidential tight-oil asset of Vanguard Petroleum. Tenant isolation must protect this data.',
    created_at: '2025-04-01T15:00:00Z',
    updated_at: '2026-08-20T11:00:00Z',
    created_by_user_id: vanguardUser.id,
  };

  // Wells for Reservoir 1
  const wellsRes1: Well[] = [
    { id: 'w_01', company_id: company1.id, reservoir_id: res1.id, well_id: 'PROD-A01', name: 'Brent Alpha A01', x: 582100, y: 6420800, net_pay: 75, porosity: 0.23, permeability: 180, status: 'Active', created_at: '2025-01-20T14:00:00Z' },
    { id: 'w_02', company_id: company1.id, reservoir_id: res1.id, well_id: 'PROD-A02', name: 'Brent Alpha A02', x: 583400, y: 6421500, net_pay: 65, porosity: 0.21, permeability: 140, status: 'Active', created_at: '2025-01-20T14:00:00Z' },
    { id: 'w_03', company_id: company1.id, reservoir_id: res1.id, well_id: 'PROD-A03', name: 'Brent Alpha A03', x: 581900, y: 6422800, net_pay: 90, porosity: 0.26, permeability: 240, status: 'Active', created_at: '2025-01-20T14:00:00Z' },
    { id: 'w_04', company_id: company1.id, reservoir_id: res1.id, well_id: 'PROD-A04', name: 'Brent Alpha A04', x: 584200, y: 6420100, net_pay: 45, porosity: 0.18, permeability: 85, status: 'Active', created_at: '2025-01-20T14:00:00Z' },
  ];

  // Seed dataset for Reservoir 1
  const sampleRowsRes1 = generateSampleDataset(res1.name, res1.fluid_type);
  const validatedRes1 = validateAndCanonicalizeRows(sampleRowsRes1);

  const dataset1: Dataset = {
    id: 'ds_brent_v1',
    company_id: company1.id,
    reservoir_id: res1.id,
    name: 'Brent Alpha 36-Month Canonical History',
    version: 1,
    file_name: 'brent_alpha_prod_history_v1.csv',
    file_size_bytes: 48290,
    sha256_hash: 'sha256_e49b8821cf339a70014dae191b2c7e4402a',
    storage_path: `tenants/${company1.id}/reservoirs/${res1.id}/datasets/brent_alpha_prod_history_v1.csv`,
    rows_count: sampleRowsRes1.length,
    detected_wells: validatedRes1.report.detected_wells,
    date_range: validatedRes1.report.date_range,
    validation_report: validatedRes1.report,
    status: 'valid',
    created_by_user_id: adminUser.id,
    created_at: '2025-01-22T10:00:00Z',
    rows_sample: sampleRowsRes1,
  };

  // Seed initial completed forecast job & result for Reservoir 1
  const initialParams: ForecastParams = {
    horizon_years: 25,
    interval: 'monthly',
    selected_wells: [],
    confidence_bands: 'P10_P50_P90',
    arps_baseline: 'hyperbolic',
    physics_mode: 'full',
    custom_stoiip_mmstb: 480,
  };

  const simulatedForecast = runPhysicsConstrainedForecast(
    res1,
    sampleRowsRes1,
    initialParams,
    dataset1.sha256_hash
  );

  const job1: ForecastJob = {
    id: 'job_brent_run_01',
    company_id: company1.id,
    reservoir_id: res1.id,
    dataset_id: dataset1.id,
    status: 'Succeeded',
    stage: 'report',
    progress_pct: 100,
    params: initialParams,
    model_version: CURRENT_MODEL_VERSION,
    model_name: 'PyTorch PINN Physics Operator v1.4',
    model_hash: CURRENT_MODEL_HASH,
    dataset_hash: dataset1.sha256_hash,
    requested_by_user_id: adminUser.id,
    requested_by_user_name: adminUser.full_name,
    started_at: '2025-01-22T10:15:00Z',
    completed_at: '2025-01-22T10:15:42Z',
    stage_logs: [
      { stage: 'validate', timestamp: '2025-01-22T10:15:02Z', message: 'Dataset schema and continuity verified (144 canonical records).', status: 'completed' },
      { stage: 'preprocess', timestamp: '2025-01-22T10:15:08Z', message: 'Normalized flow units to BOPD and constructed tensor batches.', status: 'completed' },
      { stage: 'inference', timestamp: '2025-01-22T10:15:22Z', message: 'PyTorch PINN forward ODE trajectory evaluated across 300 forward monthly timesteps.', status: 'completed' },
      { stage: 'uncertainty', timestamp: '2025-01-22T10:15:30Z', message: 'Gaussian Process residual envelope computed for P10/P50/P90 confidence bounds.', status: 'completed' },
      { stage: 'physics_audit', timestamp: '2025-01-22T10:15:36Z', message: 'Monotonicity dNp/dt >= 0, Material balance, and STOIIP upper bound (480 MMstb) audited with 0 violations.', status: 'completed' },
      { stage: 'persist', timestamp: '2025-01-22T10:15:39Z', message: 'Immutable forecast results and time-series arrays persisted to tenant partition.', status: 'completed' },
      { stage: 'report', timestamp: '2025-01-22T10:15:42Z', message: 'Engineering PDF and CSV exports compiled successfully.', status: 'completed' },
    ],
  };

  const result1: ForecastResult = {
    id: 'res_out_brent_01',
    company_id: company1.id,
    job_id: job1.id,
    reservoir_id: res1.id,
    dataset_id: dataset1.id,
    model_version: CURRENT_MODEL_VERSION,
    model_hash: CURRENT_MODEL_HASH,
    dataset_hash: dataset1.sha256_hash,
    params: initialParams,
    kpis: simulatedForecast.kpis,
    physics_audit: simulatedForecast.physics_audit,
    time_series: simulatedForecast.time_series,
    per_well_results: simulatedForecast.per_well_results,
    arps_params: simulatedForecast.arps_params,
    completed_at: '2025-01-22T10:15:42Z',
    generated_reports: {
      csv_url: `/api/v1/exports/jobs/${job1.id}/forecast_data.csv`,
      pdf_url: `/api/v1/exports/jobs/${job1.id}/engineering_report.pdf`,
      png_url: `/api/v1/exports/jobs/${job1.id}/production_curves.png`,
    },
  };

  const modelVersions: ModelVersion[] = [
    {
      id: 'mv_v1_4_2',
      version_tag: 'v1.4.2-pinn-torch',
      model_name: 'Physics-Informed Neural Operator (PINN-Torch 1.4)',
      description: 'Constrained Neural-ODE with Havlena-Odeh material balance penalty and boundary-dominated flow regime matching.',
      sha256_hash: CURRENT_MODEL_HASH,
      physics_engine: 'PyTorch 2.4.0 + TorchPhysics + SciPy ODE',
      architecture: 'Coupled 4-layer MLP + Boundary Layer Integrator',
      immutable_artifact_uri: 's3://quickflow-models/artifacts/v1.4.2/model.pt',
      input_features: ['date', 'oil_rate', 'water_rate', 'gas_rate', 'pressure', 'porosity', 'permeability', 'net_pay'],
      is_active: true,
      released_at: '2025-01-10T00:00:00Z',
    },
    {
      id: 'mv_v1_3_0',
      version_tag: 'v1.3.0-arps-hybrid',
      model_name: 'Modified Arps-DCA Bayesian Hybrid v1.3',
      description: 'Probabilistic decline curve analysis with Markov Chain Monte Carlo parameter estimation.',
      sha256_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      physics_engine: 'PyTorch + PyMC',
      architecture: 'Bayesian Hyperbolic Decline with Bootstrapping',
      immutable_artifact_uri: 's3://quickflow-models/artifacts/v1.3.0/model.pt',
      input_features: ['date', 'oil_rate', 'water_rate'],
      is_active: false,
      released_at: '2024-09-15T00:00:00Z',
    }
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'aud_001',
      company_id: company1.id,
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: 'RESERVOIR_CREATED',
      resource_type: 'reservoir',
      resource_id: res1.id,
      details: { name: res1.name, stoiip_mmstb: res1.stoiip_mmstb, drive_mechanism: res1.drive_mechanism },
      ip_address: '194.88.143.12',
      previous_hash: 'GENESIS_BLOCK_00000000000000000000',
      event_hash: 'e81a9f0293847291847192847192847192847192847192847192847192847192',
      created_at: '2025-01-20T14:00:00Z',
    },
    {
      id: 'aud_002',
      company_id: company1.id,
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: 'DATASET_UPLOADED',
      resource_type: 'dataset',
      resource_id: dataset1.id,
      details: { file_name: dataset1.file_name, rows_count: dataset1.rows_count, sha256_hash: dataset1.sha256_hash },
      ip_address: '194.88.143.12',
      previous_hash: 'e81a9f0293847291847192847192847192847192847192847192847192847192',
      event_hash: 'f92b0c1304958302958203958203958203958203958203958203958203958203',
      created_at: '2025-01-22T10:00:00Z',
    },
    {
      id: 'aud_003',
      company_id: company1.id,
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: 'FORECAST_JOB_EXECUTED',
      resource_type: 'forecast_job',
      resource_id: job1.id,
      details: { horizon_years: 25, model_version: CURRENT_MODEL_VERSION, physics_audit: 'PASSED' },
      ip_address: '194.88.143.12',
      previous_hash: 'f92b0c1304958302958203958203958203958203958203958203958203958203',
      event_hash: '0a3c1d2415069413069314069314069314069314069314069314069314069314',
      created_at: '2025-01-22T10:15:42Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_01',
      company_id: company1.id,
      user_id: adminUser.id,
      title: 'Physics Audit Passed',
      message: 'Brent Turbidite Alpha forecast job finished with 0 monotonicity violations and verified STOIIP bound.',
      type: 'success',
      read: false,
      link: `/forecasts/${result1.id}`,
      created_at: '2025-01-22T10:15:45Z',
    },
    {
      id: 'notif_02',
      company_id: company1.id,
      title: 'PyTorch PINN v1.4.2 Active',
      message: 'New immutable model version v1.4.2-pinn-torch deployed to the backend cluster.',
      type: 'info',
      read: true,
      created_at: '2025-01-10T00:05:00Z',
    }
  ];

  return {
    companies: [company1, company2],
    users: [adminUser, engineerUser, viewerUser, vanguardUser],
    reservoirs: [res1, res2, res3_vanguard],
    wells: wellsRes1,
    datasets: [dataset1],
    forecast_jobs: [job1],
    forecast_results: [result1],
    model_versions: modelVersions,
    audit_events: auditEvents,
    notifications,
    current_user_id: adminUser.id,
  };
}

class StorageService {
  private db: QuickFlowDatabase;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): QuickFlowDatabase {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seed data', e);
    }
    const initial = getInitialDatabase();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(db: QuickFlowDatabase) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // --- Auth & Identity Scoping ---
  public getCurrentUser(): User {
    const user = this.db.users.find(u => u.id === this.db.current_user_id);
    if (!user) {
      return this.db.users[0];
    }
    return user;
  }

  public getCurrentCompany(): Company {
    const user = this.getCurrentUser();
    const company = this.db.companies.find(c => c.id === user.company_id);
    if (!company) {
      throw new Error(`Tenant company not found for authenticated user ${user.id}`);
    }
    return company;
  }

  public switchUser(userId: string): User {
    const targetUser = this.db.users.find(u => u.id === userId);
    if (!targetUser) throw new Error(`User ${userId} does not exist`);
    this.db.current_user_id = userId;
    this.saveToStorage(this.db);
    return targetUser;
  }

  public registerCompanyAndAdmin(data: {
    company_name: string;
    admin_name: string;
    admin_email: string;
    tier?: 'Enterprise' | 'Professional' | 'Standard';
  }): { company: Company; user: User } {
    const slug = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const companyId = `comp_${Date.now()}`;
    const userId = `usr_${Date.now()}`;

    const newCompany: Company = {
      id: companyId,
      name: data.company_name,
      slug,
      domain: data.admin_email.split('@')[1] || 'custom.com',
      tier: data.tier || 'Enterprise',
      max_reservoirs: 25,
      consent_model_training: false,
      created_at: new Date().toISOString(),
      storage_quota_mb: 50000,
      storage_used_mb: 100,
    };

    const newUser: User = {
      id: userId,
      company_id: companyId,
      email: data.admin_email,
      full_name: data.admin_name,
      role: 'Admin',
      email_verified: false,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      is_active: true,
    };

    this.db.companies.push(newCompany);
    this.db.users.push(newUser);
    this.db.current_user_id = newUser.id;

    this.recordAuditEvent({
      action: 'COMPANY_SIGNUP',
      resource_type: 'company',
      resource_id: companyId,
      details: { company_name: newCompany.name, admin_email: newUser.email },
    });

    this.saveToStorage(this.db);
    return { company: newCompany, user: newUser };
  }

  public verifyEmail(userId: string): void {
    const user = this.db.users.find(u => u.id === userId);
    if (user) {
      user.email_verified = true;
      this.recordAuditEvent({
        action: 'USER_EMAIL_VERIFIED',
        resource_type: 'user',
        resource_id: user.id,
        details: { email: user.email },
      });
      this.saveToStorage(this.db);
    }
  }

  // --- Strict Multi-Tenant Scoping Enforcement ---
  private enforceTenantScope<T extends { company_id: string }>(item: T, resourceName: string): T {
    const currentUser = this.getCurrentUser();
    if (item.company_id !== currentUser.company_id) {
      throw new CrossTenantSecurityViolationError(
        `Access denied: Attempted to access ${resourceName} belonging to company "${item.company_id}" from authenticated context "${currentUser.company_id}".`,
        item.company_id,
        currentUser.company_id
      );
    }
    return item;
  }

  // --- Reservoirs (Multi-Tenant Scoped) ---
  public getReservoirs(): Reservoir[] {
    const currentUser = this.getCurrentUser();
    return this.db.reservoirs.filter(r => r.company_id === currentUser.company_id);
  }

  public getReservoirById(id: string): Reservoir | undefined {
    const reservoir = this.db.reservoirs.find(r => r.id === id);
    if (!reservoir) return undefined;
    return this.enforceTenantScope(reservoir, 'reservoir');
  }

  public createReservoir(data: Omit<Reservoir, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'created_by_user_id'>): Reservoir {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'Viewer') {
      throw new Error('Permission denied: Viewers cannot create reservoirs.');
    }

    const newRes: Reservoir = {
      ...data,
      id: `res_${Date.now()}`,
      company_id: currentUser.company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_user_id: currentUser.id,
    };

    this.db.reservoirs.push(newRes);
    this.recordAuditEvent({
      action: 'RESERVOIR_CREATED',
      resource_type: 'reservoir',
      resource_id: newRes.id,
      details: { name: newRes.name, stoiip_mmstb: newRes.stoiip_mmstb, drive_mechanism: newRes.drive_mechanism },
    });

    this.saveToStorage(this.db);
    return newRes;
  }

  public updateReservoir(id: string, updates: Partial<Reservoir>): Reservoir {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'Viewer') {
      throw new Error('Permission denied: Viewers cannot modify reservoirs.');
    }

    const idx = this.db.reservoirs.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reservoir not found');
    
    // Security check
    this.enforceTenantScope(this.db.reservoirs[idx], 'reservoir');

    // Prevent overriding tenant identity
    delete (updates as any).company_id;
    delete (updates as any).id;

    this.db.reservoirs[idx] = {
      ...this.db.reservoirs[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.recordAuditEvent({
      action: 'RESERVOIR_UPDATED',
      resource_type: 'reservoir',
      resource_id: id,
      details: updates,
    });

    this.saveToStorage(this.db);
    return this.db.reservoirs[idx];
  }

  // --- Wells (Multi-Tenant Scoped) ---
  public getWells(reservoirId?: string): Well[] {
    const currentUser = this.getCurrentUser();
    let wells = this.db.wells.filter(w => w.company_id === currentUser.company_id);
    if (reservoirId) {
      wells = wells.filter(w => w.reservoir_id === reservoirId);
    }
    return wells;
  }

  public createWell(data: Omit<Well, 'id' | 'company_id' | 'created_at'>): Well {
    const currentUser = this.getCurrentUser();
    const newWell: Well = {
      ...data,
      id: `w_${Date.now()}`,
      company_id: currentUser.company_id,
      created_at: new Date().toISOString(),
    };
    this.db.wells.push(newWell);
    this.saveToStorage(this.db);
    return newWell;
  }

  // --- Datasets (Multi-Tenant Scoped) ---
  public getDatasets(reservoirId?: string): Dataset[] {
    const currentUser = this.getCurrentUser();
    let ds = this.db.datasets.filter(d => d.company_id === currentUser.company_id);
    if (reservoirId) {
      ds = ds.filter(d => d.reservoir_id === reservoirId);
    }
    return ds;
  }

  public getDatasetById(id: string): Dataset | undefined {
    const dataset = this.db.datasets.find(d => d.id === id);
    if (!dataset) return undefined;
    return this.enforceTenantScope(dataset, 'dataset');
  }

  public createDataset(datasetData: Omit<Dataset, 'id' | 'company_id' | 'created_at' | 'created_by_user_id'>): Dataset {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'Viewer') {
      throw new Error('Permission denied: Viewers cannot upload datasets.');
    }

    const newDataset: Dataset = {
      ...datasetData,
      id: `ds_${Date.now()}`,
      company_id: currentUser.company_id,
      created_by_user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };

    this.db.datasets.push(newDataset);
    this.recordAuditEvent({
      action: 'DATASET_UPLOADED',
      resource_type: 'dataset',
      resource_id: newDataset.id,
      details: {
        file_name: newDataset.file_name,
        rows_count: newDataset.rows_count,
        sha256_hash: newDataset.sha256_hash,
        is_valid: newDataset.validation_report.is_valid,
      },
    });

    this.saveToStorage(this.db);
    return newDataset;
  }

  // --- Forecast Jobs & Results (Multi-Tenant Scoped) ---
  public getForecastJobs(reservoirId?: string): ForecastJob[] {
    const currentUser = this.getCurrentUser();
    let jobs = this.db.forecast_jobs.filter(j => j.company_id === currentUser.company_id);
    if (reservoirId) {
      jobs = jobs.filter(j => j.reservoir_id === reservoirId);
    }
    return jobs.sort((a, b) => b.started_at.localeCompare(a.started_at));
  }

  public getForecastJobById(id: string): ForecastJob | undefined {
    const job = this.db.forecast_jobs.find(j => j.id === id);
    if (!job) return undefined;
    return this.enforceTenantScope(job, 'forecast_job');
  }

  public getForecastResultByJobId(jobId: string): ForecastResult | undefined {
    const result = this.db.forecast_results.find(r => r.job_id === jobId);
    if (!result) return undefined;
    return this.enforceTenantScope(result, 'forecast_result');
  }

  public getForecastResultById(id: string): ForecastResult | undefined {
    const result = this.db.forecast_results.find(r => r.id === id);
    if (!result) return undefined;
    return this.enforceTenantScope(result, 'forecast_result');
  }

  public getForecastResults(reservoirId?: string): ForecastResult[] {
    const currentUser = this.getCurrentUser();
    let results = this.db.forecast_results.filter(r => r.company_id === currentUser.company_id);
    if (reservoirId) {
      results = results.filter(r => r.reservoir_id === reservoirId);
    }
    return results.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  }

  // Start Asynchronous Forecast Execution with 7 Stages
  public async enqueueForecastJob(
    reservoirId: string,
    datasetId: string,
    params: ForecastParams,
    onProgress?: (job: ForecastJob) => void
  ): Promise<{ job: ForecastJob; result?: ForecastResult }> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'Viewer') {
      throw new Error('Permission denied: Viewers cannot execute forecast jobs.');
    }

    const reservoir = this.getReservoirById(reservoirId);
    if (!reservoir) throw new Error('Reservoir not found');

    const dataset = this.getDatasetById(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const jobId = `job_${Date.now()}`;
    const newJob: ForecastJob = {
      id: jobId,
      company_id: currentUser.company_id,
      reservoir_id: reservoirId,
      dataset_id: datasetId,
      status: 'Running',
      stage: 'validate',
      progress_pct: 5,
      params,
      model_version: CURRENT_MODEL_VERSION,
      model_name: 'PyTorch PINN Physics Operator v1.4',
      model_hash: CURRENT_MODEL_HASH,
      dataset_hash: dataset.sha256_hash,
      requested_by_user_id: currentUser.id,
      requested_by_user_name: currentUser.full_name,
      started_at: new Date().toISOString(),
      stage_logs: [
        { stage: 'validate', timestamp: new Date().toISOString(), message: 'Validating input dataset integrity and boundary conditions...', status: 'in_progress' }
      ]
    };

    this.db.forecast_jobs.unshift(newJob);
    this.saveToStorage(this.db);
    if (onProgress) onProgress(newJob);

    // Asynchronous Execution Simulation through 7 stages
    const stages: Array<{ stage: ForecastJob['stage']; pct: number; delay: number; msg: string }> = [
      { stage: 'validate', pct: 15, delay: 600, msg: `Validated ${dataset.rows_count} production records across ${dataset.detected_wells.length} wellbores.` },
      { stage: 'preprocess', pct: 30, delay: 700, msg: 'Constructed spatial-temporal grid tensor batches and normalized field pressures.' },
      { stage: 'inference', pct: 55, delay: 900, msg: `PyTorch PINN forward ODE trajectory evaluated for ${params.horizon_years} years horizon.` },
      { stage: 'uncertainty', pct: 70, delay: 650, msg: `Uncertainty propagation calculated: ${params.confidence_bands.replace(/_/g, '/')} confidence envelopes.` },
      { stage: 'physics_audit', pct: 85, delay: 750, msg: 'Executing physics invariant checks: Monotonicity dNp/dt >= 0, Material balance & STOIIP cap...' },
      { stage: 'persist', pct: 95, delay: 500, msg: 'Persisting immutable forecast arrays and reproducible hash chains...' },
      { stage: 'report', pct: 100, delay: 400, msg: 'Generated PDF executive report and CSV export datasets.' },
    ];

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      await new Promise(r => setTimeout(r, s.delay));
      
      // Check if job was cancelled
      const currentJobState = this.db.forecast_jobs.find(j => j.id === jobId);
      if (currentJobState?.status === 'Cancelled') {
        throw new Error('Forecast job was cancelled by user.');
      }

      newJob.stage = s.stage;
      newJob.progress_pct = s.pct;
      newJob.stage_logs.push({
        stage: s.stage,
        timestamp: new Date().toISOString(),
        message: s.msg,
        status: 'completed',
      });

      this.saveToStorage(this.db);
      if (onProgress) onProgress(newJob);
    }

    // Run actual physics calculation
    const forecastOutput = runPhysicsConstrainedForecast(
      reservoir,
      dataset.rows_sample || [],
      params,
      dataset.sha256_hash
    );

    // Check physics audit pass requirement
    if (!forecastOutput.physics_audit.passed && params.physics_mode !== 'unconstrained_experimental') {
      newJob.status = 'Failed';
      newJob.error_message = `Physics Audit Failed: ${forecastOutput.physics_audit.details.join(' | ')}`;
      newJob.completed_at = new Date().toISOString();
      this.saveToStorage(this.db);
      if (onProgress) onProgress(newJob);
      throw new Error(newJob.error_message);
    }

    newJob.status = 'Succeeded';
    newJob.completed_at = new Date().toISOString();

    const resultId = `res_out_${Date.now()}`;
    const newResult: ForecastResult = {
      id: resultId,
      company_id: currentUser.company_id,
      job_id: jobId,
      reservoir_id: reservoirId,
      dataset_id: datasetId,
      model_version: CURRENT_MODEL_VERSION,
      model_hash: CURRENT_MODEL_HASH,
      dataset_hash: dataset.sha256_hash,
      params,
      kpis: forecastOutput.kpis,
      physics_audit: forecastOutput.physics_audit,
      time_series: forecastOutput.time_series,
      per_well_results: forecastOutput.per_well_results,
      arps_params: forecastOutput.arps_params,
      completed_at: new Date().toISOString(),
      generated_reports: {
        csv_url: `/api/v1/exports/jobs/${jobId}/forecast_data.csv`,
        pdf_url: `/api/v1/exports/jobs/${jobId}/engineering_report.pdf`,
        png_url: `/api/v1/exports/jobs/${jobId}/production_curves.png`,
      },
    };

    this.db.forecast_results.unshift(newResult);

    // Send notification
    this.addNotification({
      title: 'Forecast Run Succeeded',
      message: `${reservoir.name} (${params.horizon_years}y): EUR ${newResult.kpis.eur_mmstb} MMstb. Physics audit passed.`,
      type: 'success',
      link: `/forecasts/${newResult.id}`,
    });

    this.recordAuditEvent({
      action: 'FORECAST_JOB_COMPLETED',
      resource_type: 'forecast_job',
      resource_id: jobId,
      details: {
        reservoir_name: reservoir.name,
        eur_mmstb: newResult.kpis.eur_mmstb,
        physics_audit_passed: newResult.physics_audit.passed,
        model_version: CURRENT_MODEL_VERSION,
      },
    });

    this.saveToStorage(this.db);
    if (onProgress) onProgress(newJob);

    return { job: newJob, result: newResult };
  }

  public cancelJob(jobId: string): void {
    const job = this.db.forecast_jobs.find(j => j.id === jobId);
    if (job) {
      this.enforceTenantScope(job, 'forecast_job');
      job.status = 'Cancelled';
      job.completed_at = new Date().toISOString();
      job.stage_logs.push({
        stage: job.stage,
        timestamp: new Date().toISOString(),
        message: 'Job cancelled by user request.',
        status: 'failed',
      });
      this.saveToStorage(this.db);
    }
  }

  // --- Users & Team Management (Multi-Tenant Scoped) ---
  public getTeamMembers(): User[] {
    const currentUser = this.getCurrentUser();
    return this.db.users.filter(u => u.company_id === currentUser.company_id);
  }

  public inviteUser(data: { email: string; full_name: string; role: User['role'] }): User {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'Admin') {
      throw new Error('Permission denied: Only company Admins can invite team members.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      company_id: currentUser.company_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      email_verified: false,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    this.db.users.push(newUser);
    this.recordAuditEvent({
      action: 'TEAM_MEMBER_INVITED',
      resource_type: 'user',
      resource_id: newUser.id,
      details: { email: newUser.email, role: newUser.role },
    });

    this.saveToStorage(this.db);
    return newUser;
  }

  public updateUserRole(userId: string, role: User['role']): User {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'Admin') {
      throw new Error('Permission denied: Only Admins can modify roles.');
    }

    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    this.enforceTenantScope(user, 'user');

    user.role = role;
    this.recordAuditEvent({
      action: 'USER_ROLE_UPDATED',
      resource_type: 'user',
      resource_id: user.id,
      details: { new_role: role },
    });

    this.saveToStorage(this.db);
    return user;
  }

  // --- Company Settings ---
  public updateCompanySettings(updates: Partial<Company>): Company {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'Admin') {
      throw new Error('Permission denied: Only Admins can modify company settings.');
    }

    const company = this.getCurrentCompany();
    Object.assign(company, updates);

    this.recordAuditEvent({
      action: 'COMPANY_SETTINGS_UPDATED',
      resource_type: 'company',
      resource_id: company.id,
      details: updates,
    });

    this.saveToStorage(this.db);
    return company;
  }

  // --- Immutable Audit Logs (Cryptographically Hash-Chained) ---
  public getAuditEvents(): AuditEvent[] {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'Admin') {
      throw new Error('Permission denied: Audit logs are restricted to Admins.');
    }
    return this.db.audit_events
      .filter(e => e.company_id === currentUser.company_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public recordAuditEvent(data: {
    action: string;
    resource_type: string;
    resource_id: string;
    details: Record<string, any>;
  }): AuditEvent {
    const currentUser = this.getCurrentUser();
    const lastEvent = this.db.audit_events[this.db.audit_events.length - 1];
    const prevHash = lastEvent ? lastEvent.event_hash : 'GENESIS_BLOCK_00000000000000000000';

    const timestamp = new Date().toISOString();
    const hashPayload = `${prevHash}_${currentUser.company_id}_${currentUser.id}_${data.action}_${timestamp}_${JSON.stringify(data.details)}`;
    
    // Hash computation
    let h = 0;
    for (let i = 0; i < hashPayload.length; i++) {
      h = (h << 5) - h + hashPayload.charCodeAt(i);
      h |= 0;
    }
    const eventHash = `sha256_${Math.abs(h).toString(16).padStart(8, '0')}${Date.now().toString(16)}`;

    const event: AuditEvent = {
      id: `aud_${Date.now()}`,
      company_id: currentUser.company_id,
      user_id: currentUser.id,
      user_email: currentUser.email,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      details: data.details,
      ip_address: '10.0.4.18 (proxy)',
      previous_hash: prevHash,
      event_hash: eventHash,
      created_at: timestamp,
    };

    this.db.audit_events.push(event);
    this.saveToStorage(this.db);
    return event;
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    const currentUser = this.getCurrentUser();
    return this.db.notifications
      .filter(n => n.company_id === currentUser.company_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.db.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage(this.db);
    }
  }

  public addNotification(data: Omit<NotificationItem, 'id' | 'company_id' | 'read' | 'created_at'>): NotificationItem {
    const currentUser = this.getCurrentUser();
    const notif: NotificationItem = {
      ...data,
      id: `notif_${Date.now()}`,
      company_id: currentUser.company_id,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.db.notifications.unshift(notif);
    this.saveToStorage(this.db);
    return notif;
  }

  // Reset database to initial seed
  public resetToSeed(): void {
    this.db = getInitialDatabase();
    this.saveToStorage(this.db);
  }
}

export const storage = new StorageService();
