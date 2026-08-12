import { AlertTriangle } from 'lucide-react';

interface PageErrorProps {
  message: string;
}

export default function PageError({ message }: PageErrorProps) {
  return (
    <div className="error-banner">
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  );
}
