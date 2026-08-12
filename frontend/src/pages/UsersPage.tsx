import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageError from '../components/PageError';
import StatusBadge from '../components/StatusBadge';
import { getErrorMessage } from '../services/api';
import { authService } from '../services/authService';
import { User } from '../types';
import { formatDateTime } from '../utils/format';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError('');
      try {
        setUsers(await authService.listUsers());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">Admin-only user directory from the backend.</p>
        </div>
      </div>

      {error && <PageError message={error} />}

      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusBadge status={user.role} />
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
