import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, CheckCircle2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { challanService } from '../services/challanService';
import { Challan } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

type DialogAction = 'confirm' | 'cancel' | null;

export default function ChallanDetailPage() {
  const { id } = useParams();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole('ADMIN', 'SALES');

  async function loadChallan() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setChallan(await challanService.getById(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await challanService.confirm(id);
      setChallan(updated);
      showToast('Challan confirmed successfully');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      await loadChallan();
    } finally {
      setActionLoading(false);
      setDialogAction(null);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await challanService.cancel(id);
      setChallan(updated);
      showToast('Challan cancelled successfully');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
    } finally {
      setActionLoading(false);
      setDialogAction(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!challan) {
    return (
      <div>
        {error ? <PageError message={error} /> : <EmptyState message="Challan not found" />}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{challan.challanNumber}</h1>
          <p className="page-subtitle">Sales challan detail and confirmation status.</p>
        </div>
        {canManage && challan.status === 'DRAFT' && (
          <div className="action-group">
            <button className="btn btn-success" type="button" onClick={() => setDialogAction('confirm')}>
              <CheckCircle2 size={18} />
              Confirm Challan
            </button>
            <button className="btn btn-danger" type="button" onClick={() => setDialogAction('cancel')}>
              <Ban size={18} />
              Cancel Challan
            </button>
          </div>
        )}
      </div>

      {error && <PageError message={error} />}

      <section className="card detail-section">
        <div className="card-header">
          <h2>Challan Information</h2>
          <StatusBadge status={challan.status} />
        </div>
        <div className="card-body detail-grid">
          <div className="detail-item">
            <label>Challan Number</label>
            <p>{challan.challanNumber}</p>
          </div>
          <div className="detail-item">
            <label>Customer</label>
            <p>
              {challan.customer ? (
                <Link className="inline-link" to={`/customers/${challan.customer.id}`}>
                  {challan.customer.businessName || challan.customer.name}
                </Link>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div className="detail-item">
            <label>Created By</label>
            <p>{challan.user?.name || '-'}</p>
          </div>
          <div className="detail-item">
            <label>Created Date</label>
            <p>{formatDateTime(challan.createdAt)}</p>
          </div>
          <div className="detail-item">
            <label>Total Quantity</label>
            <p>{challan.totalQuantity}</p>
          </div>
        </div>
      </section>

      <section className="card detail-section">
        <div className="card-header">
          <h2>Items</h2>
        </div>
        {challan.items && challan.items.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No products found for this challan" />
        )}
      </section>

      <ConfirmDialog
        open={dialogAction === 'confirm'}
        title="Confirm Challan"
        message="Confirming this challan will reduce inventory. Continue?"
        confirmLabel="Confirm Challan"
        loading={actionLoading}
        onCancel={() => setDialogAction(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={dialogAction === 'cancel'}
        title="Cancel Challan"
        message="This draft challan will be cancelled. Inventory will not be changed."
        confirmLabel="Cancel Challan"
        variant="danger"
        loading={actionLoading}
        onCancel={() => setDialogAction(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
