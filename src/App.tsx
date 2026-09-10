import React, { useState } from 'react';
import { storage } from './lib/storage';
import { User } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/pages/LandingPage';
import { 
  LoginPage, 
  RegisterPage, 
  EmailVerificationPage, 
  PasswordResetPage, 
  OnboardingPage 
} from './components/pages/AuthPages';
import { DashboardPage } from './components/pages/DashboardPage';
import { ReservoirsPage, ReservoirModal } from './components/pages/ReservoirsPage';
import { ReservoirDetailPage } from './components/pages/ReservoirDetailPage';
import { UploadDatasetPage } from './components/pages/UploadDatasetPage';
import { DatasetValidationPage } from './components/pages/DatasetValidationPage';
import { ForecastConfigPage } from './components/pages/ForecastConfigPage';
import { ForecastExecutionPage } from './components/pages/ForecastExecutionPage';
import { ForecastResultsPage } from './components/pages/ForecastResultsPage';
import { ForecastHistoryPage } from './components/pages/ForecastHistoryPage';
import { TeamManagementPage } from './components/pages/TeamManagementPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { AuditLogPage } from './components/pages/AuditLogPage';
import { TenantIsolationTestModal } from './components/modals/TenantIsolationTestModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>({});
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
  };

  // Auth / Standalone Pages
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onStartDemo={() => handleNavigate('dashboard')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onSuccess={(user) => {
          setCurrentUser(user);
          handleNavigate('dashboard');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onSuccess={(user) => {
          setCurrentUser(user);
          handleNavigate('email-verification');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'email-verification') {
    return (
      <EmailVerificationPage
        onSuccess={(user) => {
          setCurrentUser(user);
          handleNavigate('onboarding');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'password-reset') {
    return <PasswordResetPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'onboarding') {
    return <OnboardingPage onFinish={() => handleNavigate('dashboard')} />;
  }

  // Authenticated App Shell (Header + Sidebar + Content)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-500/20 selection:text-teal-700">
      {/* Global Application Header */}
      <Header
        currentUser={currentUser}
        onUserSwitch={handleUserSwitch}
        onOpenTestModal={() => setShowTestModal(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />

        {/* Dynamic Main Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)]">
          {currentPage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} currentUser={currentUser} />
          )}

          {currentPage === 'reservoirs' && (
            <ReservoirsPage onNavigate={handleNavigate} currentUser={currentUser} />
          )}

          {currentPage === 'create-reservoir' && (
            <div className="p-6 max-w-4xl mx-auto">
              <ReservoirModal
                editingReservoir={null}
                onClose={() => handleNavigate('reservoirs')}
                onSaved={() => handleNavigate('reservoirs')}
              />
            </div>
          )}

          {currentPage === 'reservoir-detail' && (
            <ReservoirDetailPage
              reservoirId={navParams.reservoirId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'upload-dataset' && (
            <UploadDatasetPage
              initialReservoirId={navParams.reservoirId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'validation-report' && (
            <DatasetValidationPage
              datasetId={navParams.datasetId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'forecast-config' && (
            <ForecastConfigPage
              initialReservoirId={navParams.reservoirId}
              initialDatasetId={navParams.datasetId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'forecast-execution' && (
            <ForecastExecutionPage
              jobId={navParams.jobId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'forecast-results' && (
            <ForecastResultsPage
              resultId={navParams.resultId}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'forecast-history' && (
            <ForecastHistoryPage onNavigate={handleNavigate} currentUser={currentUser} />
          )}

          {currentPage === 'team' && (
            <TeamManagementPage currentUser={currentUser} />
          )}

          {currentPage === 'settings' && (
            <SettingsPage currentUser={currentUser} />
          )}

          {currentPage === 'audit-log' && (
            <AuditLogPage currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Cross-Tenant Isolation Test Modal */}
      {showTestModal && (
        <TenantIsolationTestModal onClose={() => setShowTestModal(false)} />
      )}
    </div>
  );
}
