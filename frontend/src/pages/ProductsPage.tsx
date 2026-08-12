import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { productService, ProductQuery } from '../services/productService';
import { Pagination as PaginationMeta, Product } from '../types';
import { formatCurrency } from '../utils/format';

const initialPagination: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = hasRole('ADMIN', 'WAREHOUSE');
  const canDelete = hasRole('ADMIN');

  async function loadProducts(nextPage = page, filters = { search, category, lowStock }) {
    setLoading(true);
    setError('');
    try {
      const params: ProductQuery = {
        page: nextPage,
        limit: 10,
        search: filters.search || undefined,
        category: filters.category || undefined,
        lowStock: filters.lowStock || undefined,
      };
      const result = await productService.list(params);
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitial() {
      try {
        setCategories(await productService.getCategories());
      } catch {
        setCategories([]);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    loadProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadProducts(1);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setLowStock(false);
    setPage(1);
    loadProducts(1, { search: '', category: '', lowStock: false });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.remove(deleteTarget.id);
      showToast('Product deleted successfully');
      setDeleteTarget(null);
      loadProducts(page);
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
          <h1>Products</h1>
          <p className="page-subtitle">Inventory catalog, SKU data, and stock thresholds.</p>
        </div>
        {canManage && (
          <Link className="btn btn-primary" to="/products/new">
            <Plus size={18} />
            New Product
          </Link>
        )}
      </div>

      <form className="filters-bar" onSubmit={handleFilter}>
        <input
          className="form-control search-control"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product, SKU, category"
        />
        <select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="checkbox-control">
          <input type="checkbox" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} />
          Low stock only
        </label>
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
        ) : products.length === 0 ? (
          <EmptyState message="No products found" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Minimum Stock</th>
                    <th>Warehouse</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{product.category}</td>
                      <td>{formatCurrency(product.unitPrice)}</td>
                      <td>{product.currentStock}</td>
                      <td>{product.minimumStock}</td>
                      <td>{product.warehouse}</td>
                      <td>{product.currentStock <= product.minimumStock ? <StatusBadge status="LOW STOCK" /> : '-'}</td>
                      <td>
                        <div className="table-actions">
                          {canManage && (
                            <Link className="btn btn-secondary btn-icon" to={`/products/${product.id}/edit`} title="Edit">
                              <Edit size={16} />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-danger btn-icon"
                              type="button"
                              title="Delete"
                              onClick={() => setDeleteTarget(product)}
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
        title="Delete Product"
        message="This product will be removed if it is not referenced by existing records."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
