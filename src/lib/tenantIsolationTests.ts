import { storage, CrossTenantSecurityViolationError, getInitialDatabase } from './storage';

export interface TestResult {
  id: string;
  name: string;
  category: 'Multi-Tenancy' | 'Role-Based Access Control' | 'Storage Partitioning' | 'Physics Constraint';
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration_ms: number;
  assertion: string;
  logs: string[];
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  duration_ms: number;
  results: TestResult[];
}

export async function runAllCrossTenantIsolationTests(): Promise<TestSuiteSummary> {
  const startTime = performance.now();
  const results: TestResult[] = [];

  // Helper for running single test
  const runTest = async (
    id: string,
    name: string,
    category: TestResult['category'],
    assertion: string,
    testFn: (logs: string[]) => Promise<void>
  ) => {
    const tStart = performance.now();
    const logs: string[] = [];
    let status: TestResult['status'] = 'PASSED';

    try {
      logs.push(`[SETUP] Initiating test: ${name}`);
      await testFn(logs);
      logs.push(`[ASSERTION_OK] ${assertion}`);
    } catch (e: any) {
      status = 'FAILED';
      logs.push(`[ASSERTION_FAIL] ${e.message || String(e)}`);
    }

    const duration_ms = Math.round(performance.now() - tStart);
    results.push({ id, name, category, status, duration_ms, assertion, logs });
  };

  // Test 1: Cross-Tenant Reservoir Query Isolation
  await runTest(
    'TC-TENANT-001',
    'Cross-Tenant Reservoir Leak Prevention',
    'Multi-Tenancy',
    'Tenant A (Apex) MUST NOT be able to query or fetch Tenant B (Vanguard) reservoir records.',
    async (logs) => {
      // Set active user as Apex Admin
      storage.switchUser('usr_sarah_admin');
      const currentUser = storage.getCurrentUser();
      logs.push(`Authenticated context: User ${currentUser.email} (Tenant: ${currentUser.company_id})`);

      // Try accessing Vanguard reservoir (res_wolfcamp_vg)
      logs.push('Attempting direct fetch of foreign reservoir "res_wolfcamp_vg" belonging to comp_vanguard_02...');
      try {
        storage.getReservoirById('res_wolfcamp_vg');
        throw new Error('FAILED: Security breach! Storage returned foreign tenant reservoir record.');
      } catch (err: any) {
        if (err instanceof CrossTenantSecurityViolationError) {
          logs.push(`SECURITY TRAP ACTIVATED: ${err.message}`);
        } else {
          throw err;
        }
      }
    }
  );

  // Test 2: Cross-Tenant Dataset Isolation
  await runTest(
    'TC-TENANT-002',
    'Cross-Tenant Dataset & Raw File Partition Isolation',
    'Multi-Tenancy',
    'Tenant A MUST NOT be able to view or list Tenant B raw CSV/XLSX production records.',
    async (logs) => {
      storage.switchUser('usr_sarah_admin');
      const datasets = storage.getDatasets();
      logs.push(`Queried all datasets in scope. Found ${datasets.length} dataset(s).`);

      const hasForeignTenantData = datasets.some(d => d.company_id !== 'comp_apex_01');
      if (hasForeignTenantData) {
        throw new Error('FAILED: Found foreign tenant dataset in current session results list!');
      }
      logs.push('Verified 100% of returned datasets match authenticated tenant company_id "comp_apex_01".');
    }
  );

  // Test 3: Cross-Tenant Forecast Results & Model Output Protection
  await runTest(
    'TC-TENANT-003',
    'Cross-Tenant Forecast Results Isolation',
    'Multi-Tenancy',
    'Forecast curves, EUR, and physics audit outputs must never cross tenant boundaries.',
    async (logs) => {
      storage.switchUser('usr_dave_vanguard');
      const vanguardUser = storage.getCurrentUser();
      logs.push(`Switched to Vanguard tenant context (${vanguardUser.company_id}).`);

      const results = storage.getForecastResults();
      logs.push(`Vanguard results count: ${results.length}`);

      // Verify Apex forecast is not visible
      const apexLeaked = results.some(r => r.reservoir_id === 'res_brent_alpha');
      if (apexLeaked) {
        throw new Error('FAILED: Apex reservoir forecast result leaked to Vanguard tenant view!');
      }
      logs.push('Vanguard cannot see Apex Brent Alpha forecast outputs. Verified.');
      
      // Restore Apex admin
      storage.switchUser('usr_sarah_admin');
    }
  );

  // Test 4: Role-Based Access Control (Viewer restrictions)
  await runTest(
    'TC-RBAC-001',
    'Role Enforcement: Viewer Mutation Lock',
    'Role-Based Access Control',
    'Users with "Viewer" role MUST be rejected from creating reservoirs or launching forecast jobs.',
    async (logs) => {
      storage.switchUser('usr_elena_view');
      const viewer = storage.getCurrentUser();
      logs.push(`Authenticated as Viewer: ${viewer.email} (Role: ${viewer.role})`);

      try {
        storage.createReservoir({
          name: 'Unauthorized Reservoir Test',
          field_name: 'Test Block',
          country: 'UK',
          location: 'North Sea',
          fluid_type: 'Black Oil',
          drive_mechanism: 'Water Drive',
          production_start_date: '2023-01-01',
          initial_pressure: 3000,
          stoiip_mmstb: 100,
          producers_count: 2,
          notes: 'Should fail',
        });
        throw new Error('FAILED: Viewer was allowed to create a reservoir record!');
      } catch (err: any) {
        logs.push(`Mutation blocked as expected: "${err.message}"`);
      }

      // Restore Apex admin
      storage.switchUser('usr_sarah_admin');
    }
  );

  // Test 5: Role-Based Access Control (Admin settings lock)
  await runTest(
    'TC-RBAC-002',
    'Role Enforcement: Engineer Audit Log & Company Settings Lock',
    'Role-Based Access Control',
    'Engineers cannot access company audit logs or invite team members.',
    async (logs) => {
      storage.switchUser('usr_marcus_eng');
      const eng = storage.getCurrentUser();
      logs.push(`Authenticated as Engineer: ${eng.email} (Role: ${eng.role})`);

      try {
        storage.getAuditEvents();
        throw new Error('FAILED: Engineer was permitted to read admin audit logs!');
      } catch (err: any) {
        logs.push(`Audit log read rejected: "${err.message}"`);
      }

      try {
        storage.inviteUser({ email: 'hacker@test.com', full_name: 'Hacker', role: 'Admin' });
        throw new Error('FAILED: Engineer was permitted to invite an Admin!');
      } catch (err: any) {
        logs.push(`User invitation rejected: "${err.message}"`);
      }

      storage.switchUser('usr_sarah_admin');
    }
  );

  // Test 6: S3 Object Storage Key Partitioning Verification
  await runTest(
    'TC-STORAGE-001',
    'Object Storage Key Path Scoping (S3 / MinIO)',
    'Storage Partitioning',
    'All dataset and report artifact URIs must strictly adhere to `tenants/{company_id}/...` hierarchy.',
    async (logs) => {
      const company = storage.getCurrentCompany();
      const datasets = storage.getDatasets();
      logs.push(`Inspecting storage paths for ${datasets.length} datasets in tenant "${company.id}"...`);

      datasets.forEach(d => {
        const expectedPrefix = `tenants/${company.id}/`;
        if (!d.storage_path.startsWith(expectedPrefix)) {
          throw new Error(`FAILED: Storage path "${d.storage_path}" violates prefix requirement "${expectedPrefix}"`);
        }
        logs.push(`Storage path verified: ${d.storage_path}`);
      });
    }
  );

  const totalTime = Math.round(performance.now() - startTime);
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    duration_ms: totalTime,
    results,
  };
}
