import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { Customer, Pagination as PaginationMeta } from '../types';
import { customerService, CustomerQuery } from '../services/customerService';
import { formatDate } from '../utils/format';

const initialPagination: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = hasRole('ADMIN', 'SALES');

  async function loadCustomers(
    nextPage = page,
    filters = { search, status, customerType }
  ) {
    setLoading(true);
    setError('');
    try {
      const params: CustomerQuery = {
        page: nextPage,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
        customerType: filters.customerType || undefined,
      };
      const result = await customerService.list(params);
      setCustomers(result.customers);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadCustomers(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setCustomerType('');
    setPage(1);
    loadCustomers(1, { search: '', status: '', customerType: '' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customerService.remove(deleteTarget.id);
      showToast('Customer deleted successfully');
      setDeleteTarget(null);
      loadCustomers(page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="page-subtitle">CRM records, follow-up dates, and account status.</p>
        </div>
        {canManage && (
          <Link className="btn btn-primary" to="/customers/new">
            <Plus size={18} />
            New Customer
          </Link>
        )}
      </div>

      <form className="filters-bar" onSubmit={handleFilter}>
        <input
          className="form-control search-control"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, business, mobile, email"
        />
        <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          className="form-control"
          value={customerType}
          onChange={(event) => setCustomerType(event.target.value)}
        >
          <option value="">All types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
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
        ) : customers.length === 0 ? (
          <EmptyState message="No customers found" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Follow-up Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.businessName}</td>
                      <td>{customer.mobile}</td>
                      <td>
                        <StatusBadge status={customer.customerType} />
                      </td>
                      <td>
                        <StatusBadge status={customer.status} />
                      </td>
                      <td>{formatDate(customer.followUpDate)}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="btn btn-secondary btn-icon" to={`/customers/${customer.id}`} title="View">
                            <Eye size={16} />
                          </Link>
                          {canManage && (
                            <Link
                              className="btn btn-secondary btn-icon"
                              to={`/customers/${customer.id}/edit`}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Link>
                          )}
                          {canManage && (
                            <button
                              className="btn btn-danger btn-icon"
                              onClick={() => setDeleteTarget(customer)}
                              title="Delete"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Customer"
        message="This customer will be removed if it is not referenced by existing records."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
