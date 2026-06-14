import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

import KharchwiseLogo from '../components/KharchwiseLogo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });
      
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8" padding="lg">
        <div className="flex flex-col items-center">
          <KharchwiseLogo size="lg" />
          <h2 className="mt-4 text-center text-xl font-bold text-gray-900">
            Introduce yourself
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hi there! My name is</label>
              <input
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff652f] focus:border-[#ff652f] sm:text-sm text-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Here's my email address:</label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff652f] focus:border-[#ff652f] sm:text-sm text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">And here's my password:</label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff652f] focus:border-[#ff652f] sm:text-sm text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              type="submit"
              variant="danger" // Splitwise signup button is often orange
              className="w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign me up!'}
            </Button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
            Already have an account?
          </Link>
        </div>
      </Card>
    </div>
  );
};
