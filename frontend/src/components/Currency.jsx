import React from 'react';
import { formatPKR } from '../utils/currency';

export default function Currency({ value, className = '', showSign = false, decimals = 0, includePrefix = true }) {
  const formatted = formatPKR(value, { showSign, decimals, includePrefix });
  return <span className={`currency ${className}`}>{formatted}</span>;
}
