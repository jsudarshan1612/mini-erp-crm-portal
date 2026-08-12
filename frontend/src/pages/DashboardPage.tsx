import { useEffect, useState } from 'react';
import { AlertTriangle, FileCheck2, FileClock, Package, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import StatusBadge from '../components/StatusBadge';
import { dashboardService } from '../services/dashboardService';
import { getErrorMessage } from '../services/api';
import { DashboardData } from '../types';
import { formatDateTime } from '../utils/format';

const statCards = [
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, className: 'stat-blue' },
  { key: 'totalProducts', label: 'Total Products', icon: Package, className: 'stat-green' },
  { key: 'lowStockProducts', label: 'Low Stock Products', icon: AlertTriangle, className: 'stat-amber' },
  { key: 'draftChallans', label: 'Draft Challans', icon: FileClock, className: 'stat-cyan' },
  { key: 'confirmedChallans', label: 'Confirmed Challans', icon: FileCheck2, className: 'stat-green' },
] as const;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        setData(await dashboardService.getStats());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Operational snapshot from the live backend.</p>
        </div>
      </div>

      {error && <PageError message={error} />}

      {data ? (
        <>
          <section className="stat-grid">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div className="stat-card" key={card.key}>
                  <div className={`icon-wrap ${card.className}`}>
                    <Icon size={22} />
                  </div>
                  <div className="label">{card.label}</div>
                  <div className="value">{data.stats[card.key]}</div>
                </div>
              );
            })}
          </section>

          <section className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <h2>Recent Challans</h2>
              </div>
              <div className="table-wrap">
                {data.recentChallans.length === 0 ? (
                  <EmptyState message="No recent challans" />
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Challan</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentChallans.map((challan) => (
                        <tr key={challan.id}>
                          <td>{challan.challanNumber}</td>
                          <td>{challan.customer?.businessName || challan.customer?.name || '-'}</td>
                          <td>
                            <StatusBadge status={challan.status} />
                          </td>
                          <td>{formatDateTime(challan.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Low Stock Products</h2>
              </div>
              <div className="table-wrap">
                {data.lowStockProducts.length === 0 ? (
                  <EmptyState message="No low stock products" />
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th>Minimum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStockProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.sku}</td>
                          <td>{product.currentStock}</td>
                          <td>{product.minimumStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="card dashboard-wide">
              <div className="card-header">
                <h2>Recent Stock Movements</h2>
              </div>
              <div className="table-wrap">
                {data.recentStockMovements.length === 0 ? (
                  <EmptyState message="No recent stock movements" />
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Reason</th>
                        <th>Created By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentStockMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>{movement.product?.name || '-'}</td>
                          <td>
                            <StatusBadge status={movement.type} />
                          </td>
                          <td>{movement.quantity}</td>
                          <td>{movement.reason}</td>
                          <td>{movement.user?.name || '-'}</td>
                          <td>{formatDateTime(movement.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        !error && <EmptyState message="Dashboard data is not available" />
      )}
    </div>
  );
}
