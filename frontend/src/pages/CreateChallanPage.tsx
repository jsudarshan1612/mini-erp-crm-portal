import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileCheck2, Plus, Save, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { challanService } from '../services/challanService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { Customer, Product } from '../types';
import { formatCurrency, parseNumberInput } from '../utils/format';

interface DraftItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export default function CreateChallanPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId]
  );

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  async function loadOptions() {
    setLoading(true);
    setError('');
    try {
      const [customerResult, productResult] = await Promise.all([
        customerService.list({ page: 1, limit: 100 }),
        productService.list({ page: 1, limit: 100 }),
      ]);
      setCustomers(customerResult.customers);
      setProducts(productResult.products);
      if (customerResult.customers.length > 0) setCustomerId(customerResult.customers[0].id);
      if (productResult.products.length > 0) setProductId(productResult.products[0].id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  const addItem = () => {
    setError('');
    const parsedQuantity = parseNumberInput(quantity);
    if (!selectedProduct) {
      setError('Product is required');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be a positive integer');
      return;
    }
    if (items.some((item) => item.productId === selectedProduct.id)) {
      setError('Duplicate product in challan items.');
      return;
    }

    setItems((current) => [
      ...current,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        unitPrice: selectedProduct.unitPrice,
        quantity: parsedQuantity,
      },
    ]);
    setQuantity('1');
  };

  const removeItem = (itemProductId: string) => {
    setItems((current) => current.filter((item) => item.productId !== itemProductId));
  };

  const validate = () => {
    if (!customerId) return 'Customer is required';
    if (items.length === 0) return 'At least one challan item is required';
    return '';
  };

  const saveDraft = async (confirmAfterSave: boolean) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const draft = await challanService.create(
        customerId,
        items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      );

      if (!confirmAfterSave) {
        showToast('Draft challan created successfully');
        navigate(`/challans/${draft.id}`);
        return;
      }

      try {
        const confirmed = await challanService.confirm(draft.id);
        showToast('Challan confirmed successfully');
        navigate(`/challans/${confirmed.id}`);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        navigate(`/challans/${draft.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const handleAddItem = (event: FormEvent) => {
    event.preventDefault();
    addItem();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New Challan</h1>
          <p className="page-subtitle">Create a draft dispatch challan from live customer and product data.</p>
        </div>
      </div>

      {error && <PageError message={error} />}

      <section className="card detail-section">
        <div className="card-header">
          <h2>Challan Details</h2>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <select
                id="customer"
                className="form-control"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.businessName} - {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <form className="card detail-section" onSubmit={handleAddItem}>
        <div className="card-header">
          <h2>Add Products</h2>
        </div>
        <div className="card-body">
          <div className="form-row align-end">
            <div className="form-group">
              <label htmlFor="product">Product</label>
              <select
                id="product"
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
            <button className="btn btn-secondary add-item-button" type="submit">
              <Plus size={18} />
              Add Item
            </button>
          </div>
        </div>
      </form>

      <section className="card detail-section">
        <div className="card-header">
          <h2>Items</h2>
          <span className="muted">Total quantity: {totalQuantity}</span>
        </div>
        {items.length === 0 ? (
          <EmptyState message="No products added to this challan" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-icon"
                        type="button"
                        title="Remove"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="modal-footer">
          <Link className="btn btn-secondary" to="/challans">
            <X size={18} />
            Cancel
          </Link>
          <button className="btn btn-secondary" type="button" disabled={saving} onClick={() => saveDraft(false)}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" type="button" disabled={saving} onClick={() => setConfirmOpen(true)}>
            <FileCheck2 size={18} />
            Confirm
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Challan"
        message="Confirming this challan will reduce inventory. Continue?"
        confirmLabel="Confirm Challan"
        loading={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => saveDraft(true)}
      />
    </div>
  );
}
