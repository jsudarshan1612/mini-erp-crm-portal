import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerCreatePage from './pages/CustomerCreatePage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerEditPage from './pages/CustomerEditPage';
import ProductsPage from './pages/ProductsPage';
import ProductCreatePage from './pages/ProductCreatePage';
import ProductEditPage from './pages/ProductEditPage';
import StockPage from './pages/StockPage';
import ChallansPage from './pages/ChallansPage';
import CreateChallanPage from './pages/CreateChallanPage';
import ChallanDetailPage from './pages/ChallanDetailPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                      <DashboardPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                      <CustomersPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/customers/new"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES']}>
                      <CustomerCreatePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                      <CustomerDetailPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/customers/:id/edit"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES']}>
                      <CustomerEditPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                      <ProductsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/products/new"
                  element={
                    <RoleRoute roles={['ADMIN', 'WAREHOUSE']}>
                      <ProductCreatePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/products/:id/edit"
                  element={
                    <RoleRoute roles={['ADMIN', 'WAREHOUSE']}>
                      <ProductEditPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/stock"
                  element={
                    <RoleRoute roles={['ADMIN', 'WAREHOUSE']}>
                      <StockPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/challans"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                      <ChallansPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/challans/new"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES']}>
                      <CreateChallanPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/challans/:id"
                  element={
                    <RoleRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                      <ChallanDetailPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RoleRoute roles={['ADMIN']}>
                      <UsersPage />
                    </RoleRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
