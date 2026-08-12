import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { productService } from '../services/productService';
import { parseNumberInput } from '../utils/format';

type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minimumStock: string;
  warehouse: string;
};

const emptyValues: ProductFormValues = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '',
  currentStock: '0',
  minimumStock: '0',
  warehouse: '',
};

interface ProductFormPageProps {
  mode: 'create' | 'edit';
}

export default function ProductFormPage({ mode }: ProductFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [values, setValues] = useState<ProductFormValues>(emptyValues);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      if (mode !== 'edit' || !id) return;
      setLoading(true);
      setError('');
      try {
        const product = await productService.getById(id);
        setValues({
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: String(product.unitPrice),
          currentStock: String(product.currentStock),
          minimumStock: String(product.minimumStock),
          warehouse: product.warehouse,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, mode]);

  const setField = (field: keyof ProductFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const unitPrice = parseNumberInput(values.unitPrice);
    const currentStock = parseNumberInput(values.currentStock);
    const minimumStock = parseNumberInput(values.minimumStock);

    if (!values.name.trim()) return 'Product name is required';
    if (!values.sku.trim()) return 'SKU is required';
    if (!values.category.trim()) return 'Category is required';
    if (Number.isNaN(unitPrice) || unitPrice < 0) return 'Unit price must be a non-negative number';
    if (!Number.isInteger(currentStock) || currentStock < 0) return 'Current stock must be a non-negative integer';
    if (!Number.isInteger(minimumStock) || minimumStock < 0) return 'Minimum stock must be a non-negative integer';
    if (!values.warehouse.trim()) return 'Warehouse is required';
    return '';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      unitPrice: parseNumberInput(values.unitPrice),
      currentStock: parseNumberInput(values.currentStock),
      minimumStock: parseNumberInput(values.minimumStock),
      warehouse: values.warehouse.trim(),
    };

    try {
      if (mode === 'edit' && id) {
        await productService.update(id, payload);
        showToast('Product updated successfully');
      } else {
        await productService.create(payload);
        showToast('Product created successfully');
      }
      navigate('/products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{mode === 'edit' ? 'Edit Product' : 'New Product'}</h1>
          <p className="page-subtitle">Maintain SKU, pricing, warehouse, and stock threshold data.</p>
        </div>
      </div>

      {error && <PageError message={error} />}

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Product name</label>
              <input
                id="name"
                className="form-control"
                value={values.name}
                onChange={(event) => setField('name', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                className="form-control"
                value={values.sku}
                onChange={(event) => setField('sku', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                className="form-control"
                value={values.category}
                onChange={(event) => setField('category', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="unitPrice">Unit price</label>
              <input
                id="unitPrice"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={values.unitPrice}
                onChange={(event) => setField('unitPrice', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="currentStock">Current stock</label>
              <input
                id="currentStock"
                className="form-control"
                type="number"
                min="0"
                step="1"
                value={values.currentStock}
                onChange={(event) => setField('currentStock', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="minimumStock">Minimum stock</label>
              <input
                id="minimumStock"
                className="form-control"
                type="number"
                min="0"
                step="1"
                value={values.minimumStock}
                onChange={(event) => setField('minimumStock', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="warehouse">Warehouse</label>
              <input
                id="warehouse"
                className="form-control"
                value={values.warehouse}
                onChange={(event) => setField('warehouse', event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Link className="btn btn-secondary" to="/products">
            <X size={18} />
            Cancel
          </Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
