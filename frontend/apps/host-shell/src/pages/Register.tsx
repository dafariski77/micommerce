import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@antigravity/shared-ui/react/Button';
import { Card } from '@antigravity/shared-ui/react/Card';
import { Input } from '@antigravity/shared-ui/react/Input';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8080';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      return data;
    },
    onSuccess: () => {
      navigate({ to: '/login' });
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <Card className="max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Register for MiCommerce</h2>
      {registerMutation.error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
          {registerMutation.error.message}
        </div>
      )}
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 border transition-colors bg-white text-gray-900"
          >
            <option value="customer">Customer</option>
            <option value="merchant">Merchant</option>
          </select>
        </div>
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Registering...' : 'Register'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Login here
        </Link>
      </p>
    </Card>
  );
}
