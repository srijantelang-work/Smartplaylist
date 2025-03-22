import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-[#E8E8E8] mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full px-4 py-2 bg-black border border-[#323232] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#E8E8E8] mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-black border border-[#323232] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#E8E8E8] mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 bg-black border border-[#323232] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#E8E8E8] mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 bg-black border border-[#323232] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          placeholder="Confirm your password"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1DB954] text-white py-2 rounded-full font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-sm text-[#E8E8E8] text-center mt-4">
        By signing up, you agree to our{' '}
        <a href="/terms" className="text-[#1DB954] hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-[#1DB954] hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
} 