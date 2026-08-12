import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="card">
      <div className="card-body">
        <EmptyState message="The page you are looking for was not found." />
        <div className="center-actions">
          <Link className="btn btn-primary" to="/dashboard">
            <Home size={18} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
