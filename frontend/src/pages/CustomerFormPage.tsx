import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { toDateTimeLocal, toIsoStringOrNull } from '../utils/format';

type CustomerFormValues = {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: Customer['customerType'];
  address: string;
  status: Customer['status'];
  followUpDate: string;
  notes: string;
};

const emptyValues: CustomerFormValues = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'RETAIL',
  address: '',
  status: 'LEAD',
  followUpDate: '',
  notes: '',
};

interface CustomerFormPageProps {
  mode: 'create' | 'edit';
}

export default function CustomerFormPage({ mode }: CustomerFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [values, setValues] = useState<CustomerFormValues>(emptyValues);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomer() {
      if (mode !== 'edit' || !id) return;
      setLoading(true);
      setError('');
      try {
        const customer = await customerService.getById(id);
        setValues({
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || '',
          businessName: customer.businessName,
          gstNumber: customer.gstNumber || '',
          customerType: customer.customerType,
          address: customer.address,
          status: customer.status,
          followUpDate: toDateTimeLocal(customer.followUpDate),
          notes: customer.notes || '',
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, mode]);

  const setField = (field: keyof CustomerFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!values.name.trim()) return 'Customer name is required';
    if (!values.mobile.trim()) return 'Mobile number is required';
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return 'Enter a valid email address';
    if (!values.businessName.trim()) return 'Business name is required';
    if (!values.address.trim()) return 'Address is required';
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
      ...values,
      email: values.email || '',
      gstNumber: values.gstNumber || '',
      notes: values.notes || '',
      followUpDate: toIsoStringOrNull(values.followUpDate),
    };

    try {
      if (mode === 'edit' && id) {
        const customer = await customerService.update(id, payload);
        showToast('Customer updated successfully');
        navigate(`/customers/${customer.id}`);
      } else {
        const customer = await customerService.create(payload);
        showToast('Customer created successfully');
        navigate(`/customers/${customer.id}`);
      }
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
          <h1>{mode === 'edit' ? 'Edit Customer' : 'New Customer'}</h1>
          <p className="page-subtitle">Maintain CRM details and follow-up planning.</p>
        </div>
      </div>

      {error && <PageError message={error} />}

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Customer name</label>
              <input
                id="name"
                className="form-control"
                value={values.name}
                onChange={(event) => setField('name', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile number</label>
              <input
                id="mobile"
                className="form-control"
                value={values.mobile}
                onChange={(event) => setField('mobile', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-control"
                type="email"
                value={values.email}
                onChange={(event) => setField('email', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="businessName">Business name</label>
              <input
                id="businessName"
                className="form-control"
                value={values.businessName}
                onChange={(event) => setField('businessName', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gstNumber">GST number</label>
              <input
                id="gstNumber"
                className="form-control"
                value={values.gstNumber}
                onChange={(event) => setField('gstNumber', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerType">Customer type</label>
              <select
                id="customerType"
                className="form-control"
                value={values.customerType}
                onChange={(event) => setField('customerType', event.target.value)}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                className="form-control"
                value={values.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="followUpDate">Follow-up date</label>
              <input
                id="followUpDate"
                className="form-control"
                type="datetime-local"
                value={values.followUpDate}
                onChange={(event) => setField('followUpDate', event.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              className="form-control"
              rows={3}
              value={values.address}
              onChange={(event) => setField('address', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="form-control"
              rows={4}
              value={values.notes}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <Link className="btn btn-secondary" to={id ? `/customers/${id}` : '/customers'}>
            <X size={18} />
            Cancel
          </Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
