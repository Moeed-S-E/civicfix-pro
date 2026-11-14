import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { fetchAdminSession, getApiErrorMessage } from './api/issues.js';
import Footer from './components/ui/Footer.jsx';
import Navbar from './components/ui/Navbar.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import PublicReportDetail from './pages/PublicReportDetail.jsx';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAdminSession, setIsCheckingAdminSession] = useState(true);
  const [adminSessionError, setAdminSessionError] = useState('');

  useEffect(() => {
    let active = true;

    fetchAdminSession()
      .then(() => {
        if (active) {
          setIsAdminAuthenticated(true);
          setAdminSessionError('');
        }
      })
      .catch((error) => {
        if (!active) return;
        setIsAdminAuthenticated(false);
        if (error.response?.status !== 401) {
          setAdminSessionError(getApiErrorMessage(error, 'Could not check the admin session.'));
        }
      })
      .finally(() => {
        if (active) setIsCheckingAdminSession(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />

      <main>
        <Routes>
          <Route element={<CommunityPage />} path="/" />
          <Route element={<PublicReportDetail />} path="/reports/:issueId" />
          <Route
            element={
              <Suspense fallback={
                <div className="mx-auto max-w-7xl px-5 py-16 text-center text-ink/55 sm:px-8">
                  Loading analytics dashboard…
                </div>
              }>
                <AdminDashboard
                  authenticated={isAdminAuthenticated}
                  authError={adminSessionError}
                  authLoading={isCheckingAdminSession}
                  onAuthChange={setIsAdminAuthenticated}
                  onAuthErrorChange={setAdminSessionError}
                />
              </Suspense>
            }
            path="/admin"
          />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
