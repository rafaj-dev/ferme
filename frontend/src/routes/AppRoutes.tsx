import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import CulturePage from '../features/culture/CulturePage';
import ProduitPage from '../features/produits/ProduitPage';
import UserPage from '../features/utilisateurs/UserPage';
import AchatsPage from '../features/achat/AchatPage';
import AnimauxPage from '../features/animal/AnimauxPage';
import RecipePage from '../features/recipe/RecipePage';
import SalesPage from '../features/sales/SalesPage';
import FinancialDashboard from '../features/dashboard/FinancialDashboard';
import ProtectedRoute from './ProtectedRoute'; 
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <FinancialDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/culture" element={<ProtectedRoute><CulturePage /></ProtectedRoute>} />
      <Route path="/produit" element={<ProtectedRoute><ProduitPage /></ProtectedRoute>} />
      <Route path="/recipe" element={<ProtectedRoute><RecipePage /></ProtectedRoute>} />
      <Route path="/sale" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
      <Route path="/utilisateur" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
      <Route path="/achats" element={<ProtectedRoute><AchatsPage /></ProtectedRoute>} />
      <Route path="/animal" element={<ProtectedRoute><AnimauxPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
