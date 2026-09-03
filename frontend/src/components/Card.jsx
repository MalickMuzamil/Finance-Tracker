import React from 'react';
import { formatPKR } from '../utils/currency';

export default function Card({
  title,
  value,
  isCurrency = true,
  icon: Icon,
  subtitle,
  badge,
  badgeType = 'neutral', // 'good' | 'bad' | 'neutral'
  className = '',
}) {
  const displayVal = isCurrency ? formatPKR(value) : (value ?? 0);

  return (
    <div className={`card metric ${className}`}>
      <div className="metricContent">
        <div className="metricHeader">
          <p className="metricTitle">{title}</p>
          {badge && <span className={`metricBadge ${badgeType}`}>{badge}</span>}
        </div>
        <strong className="metricValue">{displayVal}</strong>
        {subtitle && <span className="metricSubtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className="metricIcon">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
