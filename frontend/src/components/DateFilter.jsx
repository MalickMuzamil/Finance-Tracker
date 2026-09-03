import { useState } from 'react';
import { Calendar, ChevronDown, Check, X, Filter } from 'lucide-react';

/**
 * Format a Date object as YYYY-MM-DD local string
 */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes startDate and endDate for standard presets
 */
function getPresetDates(presetKey) {
  const now = new Date();
  const todayStr = toDateStr(now);

  switch (presetKey) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'THIS_WEEK': {
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      return { startDate: toDateStr(monday), endDate: todayStr };
    }

    case 'THIS_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDateStr(firstDay), endDate: toDateStr(lastDay) };
    }

    case 'LAST_MONTH': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toDateStr(firstDayLastMonth), endDate: toDateStr(lastDayLastMonth) };
    }

    case 'LAST_3_MONTHS': {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { startDate: toDateStr(threeMonthsAgo), endDate: todayStr };
    }

    case 'LAST_6_MONTHS': {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { startDate: toDateStr(sixMonthsAgo), endDate: todayStr };
    }

    case 'THIS_YEAR': {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      const lastDayYear = new Date(now.getFullYear(), 11, 31);
      return { startDate: toDateStr(firstDayYear), endDate: toDateStr(lastDayYear) };
    }

    case 'ALL_TIME':
    default:
      return { startDate: '', endDate: '' };
  }
}

const PRESETS = [
  { id: 'ALL_TIME', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_MONTH', label: 'Last Month' },
  { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { id: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { id: 'THIS_YEAR', label: 'This Year' },
  { id: 'CUSTOM', label: 'Custom Date Range' },
];

export default function DateFilter({ value, onChange, className = '' }) {
  const [activePreset, setActivePreset] = useState(value?.preset || 'ALL_TIME');
  const [customStart, setCustomStart] = useState(value?.startDate || '');
  const [customEnd, setCustomEnd] = useState(value?.endDate || '');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelectPreset = (presetId) => {
    setActivePreset(presetId);
    if (presetId !== 'CUSTOM') {
      const dates = getPresetDates(presetId);
      onChange?.({
        preset: presetId,
        startDate: dates.startDate,
        endDate: dates.endDate,
      });
      setShowDropdown(false);
    }
  };

  const handleApplyCustom = (e) => {
    e?.preventDefault();
    if (!customStart && !customEnd) return;
    setActivePreset('CUSTOM');
    onChange?.({
      preset: 'CUSTOM',
      startDate: customStart,
      endDate: customEnd,
    });
    setShowDropdown(false);
  };

  const handleClear = () => {
    setActivePreset('ALL_TIME');
    setCustomStart('');
    setCustomEnd('');
    onChange?.({
      preset: 'ALL_TIME',
      startDate: '',
      endDate: '',
    });
    setShowDropdown(false);
  };

  const activeLabel = PRESETS.find((p) => p.id === activePreset)?.label || 'Filter Date';

  const formatSummary = () => {
    if (activePreset === 'CUSTOM' && (customStart || customEnd)) {
      if (customStart && customEnd) return `${customStart} → ${customEnd}`;
      if (customStart) return `From ${customStart}`;
      return `Up to ${customEnd}`;
    }
    return activeLabel;
  };

  return (
    <div className={`dateFilterWrapper ${className}`}>
      <button
        type="button"
        className={`dateFilterTrigger ${activePreset !== 'ALL_TIME' ? 'active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
      >
        <Calendar size={15} className="filterIcon" />
        <span className="dateFilterText">{formatSummary()}</span>
        {activePreset !== 'ALL_TIME' && (
          <span
            className="clearInline"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            title="Clear filter"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} className={`caret ${showDropdown ? 'rotate' : ''}`} />
      </button>

      {showDropdown && (
        <div className="dateFilterDropdown" onClick={(e) => e.stopPropagation()}>
          <div className="datePresetsList">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`presetItem ${activePreset === p.id ? 'selected' : ''}`}
                onClick={() => handleSelectPreset(p.id)}
              >
                <span>{p.label}</span>
                {activePreset === p.id && <Check size={14} className="checkIcon" />}
              </button>
            ))}
          </div>

          {activePreset === 'CUSTOM' && (
            <form className="customDateRangeForm" onSubmit={handleApplyCustom}>
              <div className="customInputsRow">
                <div className="customField">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                  />
                </div>
                <div className="customField">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="customActions">
                <button type="button" className="clearBtn" onClick={handleClear}>
                  Clear
                </button>
                <button type="submit" className="applyBtn">
                  Apply
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
