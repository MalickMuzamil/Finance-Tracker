import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClass = `btn btn-${variant} btn-${size} ${className}`;

  return (
    <button
      type={type}
      className={baseClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="spinner" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 17} className="btnIcon" />
      )}
      <span>{children}</span>
    </button>
  );
}
