import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import Navbar from './components/Navbar';
import Index from './pages/Index';
import DonatePage from './pages/DonatePage';
import RequestPage from './pages/RequestPage';
import TrackingPage from './pages/TrackingPage';
import DashboardPage from './pages/DashboardPage';
import NotFound from './pages/NotFound';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import DonorRequestsPage from './pages/DonorRequestsPage';
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Navbar />

          <Routes>
            <Route
              path="/donate"
              element={
                <ProtectedRoute>
                  <DonatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <DonorRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request"
              element={
                <ProtectedRoute>
                  <RequestPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} /> {/* ✅ ADD THIS */}
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
