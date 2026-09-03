import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { User, Lock, Mail } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      return toast('Password must be at least 8 characters long', 'error');
    }
    setLoading(true);
    try {
      await signup(form);
      toast('Account created successfully!');
      nav('/');
    } catch (x) {
      toast(x.response?.data?.message || x.message || 'Signup failed', 'error');
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
        <h1>Create Account</h1>
        <p>Get started with smart Pakistani Rupee financial tracking.</p>

        <form onSubmit={submit} className="authForm">
          <FormField label="Full Name" required>
            <div className="inputWithIcon">
              <User size={16} className="inputIcon" />
              <input
                placeholder="e.g. Muzamil Saleem"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </FormField>

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

          <FormField label="Password" required helper="Must be at least 8 characters long">
            <div className="inputWithIcon">
              <Lock size={16} className="inputIcon" />
              <input
                placeholder="Create secure password"
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </FormField>

          <Button type="submit" variant="primary" loading={loading} className="wFull mt-2">
            Create Account
          </Button>
        </form>

        <div className="authFooter">
          <span>Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
