import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, RefreshCw, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { challanService, ChallanQuery } from '../services/challanService';
import { Challan, Pagination as PaginationMeta } from '../types';
import { formatDateTime } from '../utils/format';

const initialPagination: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'SALES');

  async function loadChallans(nextPage = page, filters = { search, status }) {
    setLoading(true);
    setError('');
    try {
      const params: ChallanQuery = {
        page: nextPage,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
      };
      const result = await challanService.list(params);
      setChallans(result.challans);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallans(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadChallans(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    loadChallans(1, { search: '', status: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Challans</h1>
          <p className="page-subtitle">Sales dispatch drafts and confirmed challans.</p>
        </div>
        {canManage && (
          <Link className="btn btn-primary" to="/challans/new">
            <Plus size={18} />
            New Challan
          </Link>
        )}
      </div>

      <form className="filters-bar" onSubmit={handleFilter}>
        <input
          className="form-control search-control"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search challan or customer"
        />
        <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn btn-primary" type="submit">
          <Search size={16} />
          Search
        </button>
        <button className="btn btn-secondary" type="button" onClick={handleReset}>
          <RefreshCw size={16} />
          Reset
        </button>
      </form>

      {error && <PageError message={error} />}

      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : challans.length === 0 ? (
          <EmptyState message="No challans found" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Challan Number</th>
                    <th>Customer</th>
                    <th>Total Quantity</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>{challan.challanNumber}</td>
                      <td>{challan.customer?.businessName || challan.customer?.name || '-'}</td>
                      <td>{challan.totalQuantity}</td>
                      <td>
                        <StatusBadge status={challan.status} />
                      </td>
                      <td>{challan.user?.name || '-'}</td>
                      <td>{formatDateTime(challan.createdAt)}</td>
                      <td>
                        <Link className="btn btn-secondary btn-icon" to={`/challans/${challan.id}`} title="View">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
