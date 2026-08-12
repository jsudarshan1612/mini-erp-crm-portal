import { FormEvent, useEffect, useState } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { productService, stockService } from '../services/productService';
import { Pagination as PaginationMeta, Product, StockMovement } from '../types';
import { formatDateTime, parseNumberInput } from '../utils/format';

const initialPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  async function loadStock(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const [productResult, movementResult] = await Promise.all([
        productService.list({ page: 1, limit: 100 }),
        stockService.listAllMovements(nextPage, 20),
      ]);
      setProducts(productResult.products);
      setMovements(movementResult.movements);
      setPagination(movementResult.pagination);
      if (!productId && productResult.products.length > 0) {
        setProductId(productResult.products[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsedQuantity = parseNumberInput(quantity);
    if (!productId) {
      setError('Product is required');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be a positive integer');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await stockService.addStock(productId, parsedQuantity, type, reason.trim());
      showToast(`Stock ${type} movement created successfully`);
      setQuantity('');
      setReason('');
      await loadStock(page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock</h1>
          <p className="page-subtitle">Warehouse stock positions and movement history.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => loadStock(page)}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <PageError message={error} />}

      <section className="content-grid">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Add Stock Movement</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="stockProduct">Product</label>
              <select
                id="stockProduct"
                className="form-control"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="stockType">Type</label>
              <select
                id="stockType"
                className="form-control"
                value={type}
                onChange={(event) => setType(event.target.value as 'IN' | 'OUT')}
              >
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                className="form-control"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                className="form-control"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving || products.length === 0}>
              <PlusCircle size={18} />
              {saving ? 'Saving...' : 'Add Movement'}
            </button>
          </div>
        </form>

        <div className="card">
          <div className="card-header">
            <h2>Current Stock</h2>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <EmptyState message="No products found" />
          ) : (
            <div className="table-wrap compact-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Minimum Stock</th>
                    <th>Warehouse</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{product.currentStock}</td>
                      <td>{product.minimumStock}</td>
                      <td>{product.warehouse}</td>
                      <td>{product.currentStock <= product.minimumStock ? <StatusBadge status="LOW STOCK" /> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card detail-section">
        <div className="card-header">
          <h2>Stock Movement History</h2>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : movements.length === 0 ? (
          <EmptyState message="No stock movements found" />
        ) : (
          <>
            <div className="table-wrap">
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
                  {movements.map((movement) => (
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
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
