import { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ResetPassword() {
  const { token: urlToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = urlToken || searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Reset token is missing. Please use the link provided in your email.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        token,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);
      toast(res.data?.message || 'Password reset successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password';
      setErrorMessage(msg);
      toast(msg, 'error');
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

        <h1>Set New Password</h1>
        <p>Choose a secure password that you haven't used before.</p>

        {success ? (
          <div>
            <div className="authSuccessBox">
              <div className="authSuccessIcon">
                <CheckCircle2 size={24} />
              </div>
              <h3>Password Updated!</h3>
              <p>Your password has been reset successfully. You can now sign in with your new credentials.</p>
            </div>

            <Button variant="primary" onClick={() => nav('/login')} className="wFull mt-2">
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="authForm">
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#f87171',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMessage}</div>
              </div>
            )}

            <FormField label="New Password" required helper="Must be at least 8 characters">
              <div className="inputWithIcon">
                <Lock size={16} className="inputIcon" />
                <input
                  placeholder="Enter new password"
                  type={showPass ? 'text' : 'password'}
                  className="hasToggle"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
                <button
                  type="button"
                  className="passwordToggleBtn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password" required>
              <div className="inputWithIcon">
                <Lock size={16} className="inputIcon" />
                <input
                  placeholder="Re-enter new password"
                  type={showConfirm ? 'text' : 'password'}
                  className="hasToggle"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
                <button
                  type="button"
                  className="passwordToggleBtn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <Button type="submit" variant="primary" loading={loading} className="wFull mt-2">
              Update Password
            </Button>

            <div className="authFooter" style={{ marginTop: '20px' }}>
              <span>Back to </span>
              <Link to="/login">Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
