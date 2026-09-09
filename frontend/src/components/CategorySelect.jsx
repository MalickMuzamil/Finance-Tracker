import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { Search, Plus, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

/**
 * Reusable searchable category combobox component.
 * Allows selecting existing categories or creating a new category on the fly.
 */
export default function CategorySelect({
  value,
  onChange,
  type = 'DAILY',
  placeholder = 'Select or search category...',
  disabled = false,
  className = '',
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories by type relevance and search string
  const filteredCategories = useMemo(() => {
    let list = categories;

    // If a specific type is requested (e.g. FOOD or DAILY), sort relevant ones to top
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    } else if (type && type !== 'ALL') {
      // Show matching type first, then others
      list = [...categories].sort((a, b) => {
        if (a.type === type && b.type !== type) return -1;
        if (a.type !== type && b.type === type) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [categories, search, type]);

  // Check if search query exactly matches an existing category
  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return categories.some((c) => c.name.toLowerCase() === q);
  }, [categories, search]);

  const handleSelect = (categoryName) => {
    onChange?.(categoryName);
    setSearch('');
    setOpen(false);
  };

  const handleCreate = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const res = await api.post('/categories', {
        name: trimmed,
        type: type && type !== 'ALL' ? type : 'DAILY',
      });

      const newCategory = res.data;
      // Add to local list if not already present
      setCategories((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === newCategory.name.toLowerCase());
        return exists ? prev : [newCategory, ...prev];
      });

      onChange?.(newCategory.name);
      toast(`Category "${newCategory.name}" created and saved!`, 'success');
      setSearch('');
      setOpen(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create category', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getTypeBadgeClass = (cType) => {
    switch (cType) {
      case 'FOOD':
        return 'badgeFood';
      case 'DAILY':
      case 'UTILITY':
        return 'badgeDaily';
      case 'SALARY':
      case 'INCOME':
        return 'badgeIncome';
      default:
        return 'badgeGeneral';
    }
  };

  return (
    <div className={`categorySelectWrapper ${className}`} ref={containerRef}>
      <div
        className={`categorySelectTrigger ${open ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        tabIndex={0}
      >
        <span className={value ? 'selectedValue' : 'placeholderValue'}>
          {value || placeholder}
        </span>
        <ChevronDown size={15} className={`selectCaret ${open ? 'rotate' : ''}`} />
      </div>

      {open && (
        <div className="categorySelectDropdown" onClick={(e) => e.stopPropagation()}>
          <div className="categorySearchBox">
            <Search size={14} className="categorySearchIcon" />
            <input
              ref={inputRef}
              type="text"
              className="categorySearchInput"
              placeholder="Search or type to create..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredCategories.length > 0 && exactMatch) {
                    handleSelect(filteredCategories[0].name);
                  } else if (!exactMatch && search.trim()) {
                    handleCreate();
                  }
                }
              }}
            />
          </div>

          <div className="categoryList">
            {loading ? (
              <div className="categoryDropdownEmpty">Loading categories...</div>
            ) : (
              <>
                {/* Create new category option if search doesn't match exactly */}
                {!exactMatch && search.trim().length > 0 && (
                  <button
                    type="button"
                    className="createCategoryBtn"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    <Plus size={14} className="createIcon" />
                    <span>
                      {creating ? 'Creating...' : `+ Create "${search.trim()}"`}
                    </span>
                    <Sparkles size={13} className="sparkleIcon" />
                  </button>
                )}

                {filteredCategories.length === 0 && exactMatch ? (
                  <div className="categoryDropdownEmpty">No categories found</div>
                ) : (
                  filteredCategories.map((c) => {
                    const isSelected = value?.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c._id || c.name}
                        type="button"
                        className={`categoryOptionItem ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelect(c.name)}
                      >
                        <div className="categoryOptionLeft">
                          <span className={`categoryPill ${getTypeBadgeClass(c.type)}`}>
                            {c.type}
                          </span>
                          <span className="categoryOptionName">{c.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="selectedCheck" />}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
