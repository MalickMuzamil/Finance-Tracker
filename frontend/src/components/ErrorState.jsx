import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`errorState ${className}`}>
      <div className="errorStateIcon">
        <AlertTriangle size={32} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
