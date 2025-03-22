import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Enter your password"
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
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center">
        <a href="/auth/reset-password" className="text-sm text-[#1DB954] hover:underline">
          Forgot your password?
        </a>
      </div>
    </form>
  );
} 