import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, Edit, Save } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { formatDate, formatDateTime, toIsoStringOrNull } from '../utils/format';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole('ADMIN', 'SALES');

  async function loadCustomer() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setCustomer(await customerService.getById(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddFollowUp = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    if (!note.trim()) {
      setError('Follow-up note is required');
      return;
    }
    const isoDate = toIsoStringOrNull(followUpDate);
    if (!isoDate) {
      setError('Follow-up date is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await customerService.addFollowUp(id, note.trim(), isoDate);
      showToast('Follow-up added successfully');
      setNote('');
      setFollowUpDate('');
      await loadCustomer();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!customer) {
    return (
      <div>
        {error ? <PageError message={error} /> : <EmptyState message="Customer not found" />}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{customer.businessName}</h1>
          <p className="page-subtitle">{customer.name}</p>
        </div>
        {canManage && (
          <Link className="btn btn-primary" to={`/customers/${customer.id}/edit`}>
            <Edit size={18} />
            Edit Customer
          </Link>
        )}
      </div>

      {error && <PageError message={error} />}

      <section className="card detail-section">
        <div className="card-header">
          <h2>Customer Information</h2>
        </div>
        <div className="card-body detail-grid">
          <div className="detail-item">
            <label>Name</label>
            <p>{customer.name}</p>
          </div>
          <div className="detail-item">
            <label>Business</label>
            <p>{customer.businessName}</p>
          </div>
          <div className="detail-item">
            <label>Mobile</label>
            <p>{customer.mobile}</p>
          </div>
          <div className="detail-item">
            <label>Email</label>
            <p>{customer.email || '-'}</p>
          </div>
          <div className="detail-item">
            <label>GST Number</label>
            <p>{customer.gstNumber || '-'}</p>
          </div>
          <div className="detail-item">
            <label>Type</label>
            <p>
              <StatusBadge status={customer.customerType} />
            </p>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <p>
              <StatusBadge status={customer.status} />
            </p>
          </div>
          <div className="detail-item">
            <label>Follow-up Date</label>
            <p>{formatDate(customer.followUpDate)}</p>
          </div>
          <div className="detail-item detail-span">
            <label>Address</label>
            <p>{customer.address}</p>
          </div>
          <div className="detail-item detail-span">
            <label>Notes</label>
            <p>{customer.notes || '-'}</p>
          </div>
        </div>
      </section>

      <section className="content-grid">
        {canManage && (
          <form className="card" onSubmit={handleAddFollowUp}>
            <div className="card-header">
              <h2>Add Follow-up</h2>
              <CalendarPlus size={18} />
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="followUpNote">Note</label>
                <textarea
                  id="followUpNote"
                  className="form-control"
                  rows={4}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="followUpDate">Follow-up date</label>
                <input
                  id="followUpDate"
                  className="form-control"
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Add Follow-up'}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Follow-up History</h2>
          </div>
          {customer.followUps && customer.followUps.length > 0 ? (
            <div className="timeline-list">
              {customer.followUps.map((followUp) => (
                <div className="timeline-item" key={followUp.id}>
                  <div>
                    <strong>{formatDateTime(followUp.followUpDate)}</strong>
                    <p>{followUp.note}</p>
                  </div>
                  <span>{followUp.user?.name || 'User'}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No follow-ups recorded" />
          )}
        </div>
      </section>
    </div>
  );
}
