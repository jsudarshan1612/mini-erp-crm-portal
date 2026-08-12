interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  ACTIVE: 'badge-success',
  LEAD: 'badge-info',
  INACTIVE: 'badge-gray',
  DRAFT: 'badge-warning',
  CONFIRMED: 'badge-success',
  CANCELLED: 'badge-danger',
  RETAIL: 'badge-primary',
  WHOLESALE: 'badge-info',
  DISTRIBUTOR: 'badge-gray',
  IN: 'badge-success',
  OUT: 'badge-danger',
  ADMIN: 'badge-primary',
  SALES: 'badge-info',
  WAREHOUSE: 'badge-warning',
  ACCOUNTS: 'badge-gray',
  'LOW STOCK': 'badge-danger',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = statusMap[status] || 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}
