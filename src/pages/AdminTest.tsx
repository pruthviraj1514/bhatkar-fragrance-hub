import { useState } from 'react';
import api from '@/lib/axios';

export default function AdminLoginTest() {
  const [email, setEmail] = useState('admin@bhatkar.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await api.post('/admin/login', {
        email,
        password
      });
      
      setResponse(res.data);
      if (res.data.data.token) {
        setToken(res.data.data.token);
        localStorage.setItem('adminToken', res.data.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetProfile = async () => {
    if (!token) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get('/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!token) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/admin/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResponse(res.data);
      setToken('');
      localStorage.removeItem('adminToken');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Admin Login Test</h1>
      
      <form onSubmit={handleAdminLogin} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Logging in...' : 'Admin Login'}
        </button>
      </form>

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#d4edda', borderRadius: '5px' }}>
          <p><strong>Token received:</strong></p>
          <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>{token}</p>
          <button 
            onClick={handleGetProfile}
            disabled={loading}
            style={{ padding: '8px 15px', marginRight: '10px', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {loading ? 'Loading...' : 'Get Profile'}
          </button>
          <button 
            onClick={handleLogout}
            disabled={loading}
            style={{ padding: '8px 15px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ padding: '10px', background: '#e7f3ff', borderRadius: '5px' }}>
          <strong>Response:</strong>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
