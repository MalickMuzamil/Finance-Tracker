import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  type = 'table', // 'table' | 'cards' | 'fullscreen' | 'spinner'
  count = 4,
  message = 'Loading data...',
}) {
  if (type === 'fullscreen') {
    return (
      <div className="fullscreenLoader">
        <div className="loaderOrb" />
        <div className="loaderContent">
          <div className="brandTitle">
            Fin<span>ance</span>
            <small>TRACKER</small>
          </div>
          <div className="spinnerRing">
            <Loader2 size={28} className="spinner" />
          </div>
          <p className="loaderText">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card metric skeletonCard">
            <div className="skeletonLine skeletonLabel" />
            <div className="skeletonLine skeletonValue" />
            <div className="skeletonLine skeletonSub" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className="inlineSpinnerWrap">
        <Loader2 size={24} className="spinner inlineSpinner" />
        <p className="loadingMessage">{message}</p>
      </div>
    );
  }

  return (
    <div className="loadingStateWrap">
      <div className="skeletonTable">
        <div className="skeletonHeader" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeletonRow">
            <div className="skeletonCell w-20" />
            <div className="skeletonCell w-30" />
            <div className="skeletonCell w-25" />
            <div className="skeletonCell w-15" />
          </div>
        ))}
      </div>
      <div className="tableLoadingFooter">
        <Loader2 size={16} className="spinner" />
        <p className="loadingMessage">{message}</p>
      </div>
    </div>
  );
}
