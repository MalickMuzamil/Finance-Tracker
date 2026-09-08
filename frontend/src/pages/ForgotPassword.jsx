import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast('Please enter your email address', 'error');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
      toast(res.data?.message || 'Password reset link sent to your email!');
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Failed to send reset link', 'error');
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

        <h1>Reset Password</h1>
        <p>Enter your account email to receive a secure password recovery link.</p>

        {submitted ? (
          <div>
            <div className="authSuccessBox">
              <div className="authSuccessIcon">
                <CheckCircle2 size={24} />
              </div>
              <h3>Check Your Email</h3>
              <p>
                If an account with <strong>{email}</strong> exists, we have sent instructions to reset your password.
                Please check your inbox and spam folders.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="wFull mb-2"
            >
              Send to a different email
            </Button>

            <div className="authFooter" style={{ marginTop: '16px' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="authForm">
            <FormField label="Registered Email" required>
              <div className="inputWithIcon">
                <Mail size={16} className="inputIcon" />
                <input
                  placeholder="name@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </FormField>

            <Button type="submit" variant="primary" loading={loading} className="wFull mt-2">
              Send Reset Link
            </Button>

            <div className="authFooter" style={{ marginTop: '20px' }}>
              <span>Remember your password? </span>
              <Link to="/login">Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
