import React from 'react';

export default function FormField({
  label,
  required = false,
  error,
  helper,
  children,
  className = '',
}) {
  return (
    <div className={`field ${error ? 'hasError' : ''} ${className}`}>
      {label && (
        <label className="fieldLabel">
          <span>{label}</span>
          {required && <span className="requiredStar">*</span>}
        </label>
      )}
      <div className="inputControlWrapper">{children}</div>
      {error ? (
        <span className="fieldError">{error}</span>
      ) : helper ? (
        <span className="fieldHelper">{helper}</span>
      ) : null}
    </div>
  );
}
