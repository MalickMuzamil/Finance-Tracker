import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast('Signed in successfully');
      nav('/');
    } catch (x) {
      toast(x.response?.data?.message || x.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authGlow" />
      <div className="authCard">
        <div className="brand">
          Fin<span>ance</span>
          <small>TRACKER • PAKISTAN</small>
        </div>
        <h1>Welcome Back</h1>
        <p>Securely manage your personal finances in PKR.</p>

        <form onSubmit={submit} className="authForm">
          <FormField label="Email Address" required>
            <div className="inputWithIcon">
              <Mail size={16} className="inputIcon" />
              <input
                placeholder="name@example.com"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </FormField>

          <FormField label="Password" required>
            <div className="inputWithIcon">
              <Lock size={16} className="inputIcon" />
              <input
                placeholder="Enter password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </FormField>

          <Button type="submit" variant="primary" loading={loading} className="wFull mt-2">
            Sign In
          </Button>
        </form>

        <div className="authFooter">
          <span>Don't have an account? </span>
          <Link to="/signup">Create one now</Link>
        </div>
      </div>
    </div>
  );
}
