import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = 'No data found' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Inbox size={40} strokeWidth={1.5} color="#9ca3af" />
      <p>{message}</p>
    </div>
  );
}
