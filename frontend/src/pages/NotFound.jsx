import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Compass, ArrowLeft, Home, Car, WalletCards, ArrowLeftRight } from 'lucide-react';

export default function NotFound() {
  const nav = useNavigate();
  const { user } = useAuth();

  return (
    <div className="notFoundPage">
      <div className="authGlow" />
      <div className="notFoundCard">
        <div className="brand" style={{ marginBottom: '16px' }}>
          Fin<span>ance</span>
          <small>TRACKER • 404</small>
        </div>

        <div className="notFoundGlitchCode">404</div>

        <div className="notFoundIconWrapper">
          <Compass size={32} />
        </div>

        <h1>Page Not Found</h1>
        <p>
          The resource or page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>

        <div className="notFoundActions">
          <Button
            variant="primary"
            onClick={() => nav(user ? '/' : '/login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Home size={16} />
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </Button>

          <Button
            variant="outline"
            onClick={() => nav(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
        </div>

        {user && (
          <div className="notFoundLinks">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Home size={14} /> Dashboard
            </Link>
            <Link to="/vehicles" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={14} /> Vehicles
            </Link>
            <Link to="/finance" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <WalletCards size={14} /> Finance
            </Link>
            <Link to="/lend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeftRight size={14} /> Len Den
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
