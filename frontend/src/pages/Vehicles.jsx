import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import DateFilter from '../components/DateFilter';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { formatPKR } from '../utils/currency';
import { useToast } from '../components/Toast';
import {
  Car,
  Bike,
  Plus,
  Edit2,
  Trash2,
  Fuel,
  Search,
  Gauge,
  Wrench,
  Droplet,
  Calendar,
  AlertTriangle,
  FileText,
  Disc,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'FUEL', label: 'Fuel / Petrol', icon: Fuel },
  { id: 'TUNING', label: 'Tuning & Service', icon: Wrench },
  { id: 'OIL_CHANGE', label: 'Oil Change', icon: Droplet },
  { id: 'REPAIR', label: 'Mechanical Repair', icon: Wrench },
  { id: 'TIRE', label: 'Tire & Puncture', icon: Disc },
  { id: 'TAX_TOKEN', label: 'Token & Tax', icon: FileText },
  { id: 'WASH', label: 'Washing & Care', icon: Droplet },
  { id: 'OTHER', label: 'Other Expense', icon: Gauge },
];

const INITIAL_FORM = {
  type: 'CAR',
  name: '',
  expenseCategory: 'FUEL',
  expense: '',
  date: new Date().toISOString().slice(0, 10),
  odometer: '',
  nextServiceDueKm: '',
  nextServiceDueDate: '',
  repairType: '',
  partsReplaced: '',
  workshopName: '',
  fuelLiters: '',
  fuelRate: '',
  note: '',
};

export default function Vehicles() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'CAR' | 'BIKE'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/vehicles', { params });

      if (res.data.data) {
        setRows(res.data.data);
        setTotalRecords(res.data.total ?? res.data.data.length);
        setTotalPages(res.data.totalPages ?? 1);
      } else if (Array.isArray(res.data)) {
        setRows(res.data);
        setTotalRecords(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch vehicle expenses';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageLimit, dateFilter, typeFilter, categoryFilter, searchQuery, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed summary metrics
  const summary = useMemo(() => {
    let car = 0;
    let bike = 0;
    let fuelTotal = 0;
    let maintenanceTotal = 0;

    rows.forEach((r) => {
      const val = Number(r.expense) || 0;
      if (r.type === 'CAR') car += val;
      else if (r.type === 'BIKE') bike += val;

      if (r.expenseCategory === 'FUEL') fuelTotal += val;
      if (['TUNING', 'OIL_CHANGE', 'REPAIR', 'TIRE'].includes(r.expenseCategory)) {
        maintenanceTotal += val;
      }
    });

    return {
      car,
      bike,
      fuelTotal,
      maintenanceTotal,
      total: car + bike,
      count: totalRecords,
    };
  }, [rows, totalRecords]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      type: item.type || 'CAR',
      name: item.name || '',
      expenseCategory: item.expenseCategory || 'OTHER',
      expense: item.expense || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      odometer: item.odometer ?? '',
      nextServiceDueKm: item.nextServiceDueKm ?? '',
      nextServiceDueDate: item.nextServiceDueDate
        ? new Date(item.nextServiceDueDate).toISOString().slice(0, 10)
        : '',
      repairType: item.repairType || '',
      partsReplaced: item.partsReplaced || '',
      workshopName: item.workshopName || '',
      fuelLiters: item.fuelLiters ?? '',
      fuelRate: item.fuelRate ?? '',
      note: item.note || '',
    });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, form);
        toast('Vehicle expense updated successfully');
      } else {
        await api.post('/vehicles', form);
        toast('Vehicle expense logged successfully');
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${deleteTarget._id}`);
      toast('Vehicle expense deleted');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDateCell = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const getCategoryLabel = (cat) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.label : cat || 'General';
  };

  return (
    <section className="vehiclesPage">
      {/* Header */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">VEHICLES</p>
          <h2>Car & Bike Detailed Expense Log</h2>
        </div>
        <div className="sectionHeadActions">
          <DateFilter
            value={dateFilter}
            onChange={(d) => {
              setDateFilter(d);
              setCurrentPage(1);
            }}
          />
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add vehicle expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid summaryGrid">
        <Card
          title="Car Spending"
          value={summary.car}
          icon={Car}
          subtitle="Total Fuel & Maintenance"
        />
        <Card
          title="Bike Spending"
          value={summary.bike}
          icon={Bike}
          subtitle="Total Fuel & Maintenance"
        />
        <Card
          title="Total Fuel Cost"
          value={summary.fuelTotal}
          icon={Fuel}
          badge="Fuel Inflow"
          badgeType="neutral"
        />
        <Card
          title="Repairs & Tuning"
          value={summary.maintenanceTotal}
          icon={Wrench}
          badge="Maintenance"
          badgeType="bad"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="filterBar">
        <div className="typePills">
          {['ALL', 'CAR', 'BIKE'].map((t) => (
            <button
              key={t}
              type="button"
              className={`filterPill ${typeFilter === t ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter(t);
                setCurrentPage(1);
              }}
            >
              {t === 'ALL' ? 'All Vehicles' : t === 'CAR' ? '🚗 Cars Only' : '🏍️ Bikes Only'}
            </button>
          ))}
        </div>

        <div className="statusPills">
          <button
            type="button"
            className={`filterPill ${categoryFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('ALL');
              setCurrentPage(1);
            }}
          >
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`filterPill statusFilterPill ${categoryFilter === c.id ? 'active' : ''}`}
              onClick={() => {
                setCategoryFilter(c.id);
                setCurrentPage(1);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="searchBox">
          <Search size={15} className="searchIcon" />
          <input
            type="text"
            placeholder="Search vehicle, workshop, parts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="panel">
          <LoadingState count={5} message="Loading vehicle maintenance and fuel records..." />
        </div>
      ) : error ? (
        <div className="panel">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Fuel}
            title="No vehicle records found"
            description={
              searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || dateFilter.preset !== 'ALL_TIME'
                ? 'No vehicle records match your selected filters. Try resetting the filters or add a new expense.'
                : 'No car or bike maintenance or fuel expenses recorded yet.'
            }
            actionLabel="Add Vehicle Expense"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="panel tableWrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Expense Type</th>
                <th>Specific Details</th>
                <th>Meter / Service</th>
                <th>Amount (PKR)</th>
                <th>Note</th>
                <th className="textRight">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{formatDateCell(r.date)}</td>
                  <td>
                    <div className="vehicleMetaCell">
                      <strong>{r.name}</strong>
                      <span className={`pill ${r.type === 'CAR' ? 'carPill' : 'bikePill'}`}>
                        {r.type === 'CAR' ? '🚗 Car' : '🏍️ Bike'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="categoryBadge">
                      {getCategoryLabel(r.expenseCategory)}
                    </span>
                  </td>
                  <td>
                    <div className="vehicleMetaCell">
                      {/* If Fuel */}
                      {r.expenseCategory === 'FUEL' && (
                        <>
                          {r.fuelLiters ? <span className="subDetailText">⛽ {r.fuelLiters} Liters</span> : null}
                          {r.fuelRate ? <span className="subDetailText">@ PKR {r.fuelRate}/L</span> : null}
                        </>
                      )}

                      {/* If Repair */}
                      {r.expenseCategory === 'REPAIR' && (
                        <>
                          {r.repairType && <strong>{r.repairType}</strong>}
                          {r.partsReplaced && <span className="subDetailText">Parts: {r.partsReplaced}</span>}
                          {r.workshopName && <span className="subDetailText">Shop: {r.workshopName}</span>}
                        </>
                      )}

                      {/* If Tuning / Oil Change */}
                      {['TUNING', 'OIL_CHANGE'].includes(r.expenseCategory) && (
                        <>
                          {r.partsReplaced && <span>{r.partsReplaced}</span>}
                          {r.workshopName && <span className="subDetailText">Shop: {r.workshopName}</span>}
                        </>
                      )}

                      {!r.repairType && !r.partsReplaced && !r.workshopName && !r.fuelLiters && (
                        <span className="subDetailText">{r.note || '—'}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="vehicleMetaCell">
                      {r.odometer ? (
                        <span className="vehicleMetaBadge">
                          <Gauge size={12} /> {Number(r.odometer).toLocaleString()} KM
                        </span>
                      ) : null}
                      {r.nextServiceDueKm ? (
                        <span className="serviceDueAlert">
                          <AlertTriangle size={12} /> Due: {Number(r.nextServiceDueKm).toLocaleString()} KM
                        </span>
                      ) : null}
                      {r.nextServiceDueDate ? (
                        <span className="subDetailText">
                          <Calendar size={11} /> Due: {formatDateCell(r.nextServiceDueDate)}
                        </span>
                      ) : null}
                      {!r.odometer && !r.nextServiceDueKm && !r.nextServiceDueDate && '—'}
                    </div>
                  </td>
                  <td className="amountCell textBad">
                    {formatPKR(r.expense)}
                  </td>
                  <td className="noteCell">{r.note || '—'}</td>
                  <td className="textRight">
                    <div className="rowActions">
                      <button
                        type="button"
                        className="actionBtn editBtn"
                        title="Edit expense"
                        onClick={() => handleOpenEdit(r)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="actionBtn deleteBtn"
                        title="Delete expense"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={pageLimit}
            onPageChange={setCurrentPage}
            onLimitChange={setPageLimit}
          />
        </div>
      )}

      {/* Add / Edit Vehicle Expense Modal */}
      <Modal
        open={openModal}
        title={editingId ? 'Edit Vehicle Expense' : 'Log Deep Vehicle Expense'}
        onClose={() => setOpenModal(false)}
        maxWidth="620px"
      >
        <form className="formGrid" onSubmit={handleSave}>
          <div className="formTwoCol">
            <FormField label="Vehicle Type" required>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="CAR">Car</option>
                <option value="BIKE">Bike / Motorcycle</option>
              </select>
            </FormField>

            <FormField label="Vehicle Name / Model" required>
              <input
                type="text"
                required
                placeholder="e.g. Honda Civic"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Expense Category" required>
            <select
              value={form.expenseCategory}
              onChange={(e) => setForm({ ...form, expenseCategory: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* DYNAMIC SECTION: TUNING & OIL CHANGE */}
          {['TUNING', 'OIL_CHANGE'].includes(form.expenseCategory) && (
            <div className="dynamicSectionBox">
              <p className="dynamicSectionHead">Tuning & Oil Service Specifications</p>
              <div className="formTwoCol">
                <FormField label="Current Meter Reading (KM)">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45000"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                </FormField>

                <FormField label="Next Service Due at (KM)">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={form.nextServiceDueKm}
                    onChange={(e) => setForm({ ...form, nextServiceDueKm: e.target.value })}
                  />
                </FormField>
              </div>

              <div className="formTwoCol">
                <FormField label="Next Service Due Date">
                  <input
                    type="date"
                    value={form.nextServiceDueDate}
                    onChange={(e) => setForm({ ...form, nextServiceDueDate: e.target.value })}
                  />
                </FormField>

                <FormField label="Workshop / Mechanic Name">
                  <input
                    type="text"
                    placeholder="e.g. Tariq Autos"
                    value={form.workshopName}
                    onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Service Details & Items">
                <input
                  type="text"
                  placeholder="e.g. 5W-30 Synthetic Oil + OEM Filter"
                  value={form.partsReplaced}
                  onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })}
                />
              </FormField>
            </div>
          )}

          {/* DYNAMIC SECTION: REPAIR & MECHANICAL */}
          {form.expenseCategory === 'REPAIR' && (
            <div className="dynamicSectionBox">
              <p className="dynamicSectionHead">Repair & Mechanical Breakdown Details</p>
              <div className="formTwoCol">
                <FormField label="Repair Type / System">
                  <input
                    type="text"
                    placeholder="e.g. Front Brake Pads & Discs"
                    value={form.repairType}
                    onChange={(e) => setForm({ ...form, repairType: e.target.value })}
                  />
                </FormField>

                <FormField label="Workshop / Mechanic Name">
                  <input
                    type="text"
                    placeholder="e.g. Master Motors Workshop"
                    value={form.workshopName}
                    onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                  />
                </FormField>
              </div>

              <div className="formTwoCol">
                <FormField label="Parts Replaced / Installed">
                  <input
                    type="text"
                    placeholder="e.g. OEM Brake Pads + Rotor skimming"
                    value={form.partsReplaced}
                    onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })}
                  />
                </FormField>

                <FormField label="Current Meter Reading (KM)">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 62000"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* DYNAMIC SECTION: FUEL */}
          {form.expenseCategory === 'FUEL' && (
            <div className="dynamicSectionBox">
              <p className="dynamicSectionHead">Fuel Details</p>
              <div className="formTwoCol">
                <FormField label="Fuel Volume (Liters)">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 25"
                    value={form.fuelLiters}
                    onChange={(e) => setForm({ ...form, fuelLiters: e.target.value })}
                  />
                </FormField>

                <FormField label="Fuel Rate per Liter (PKR)">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 275"
                    value={form.fuelRate}
                    onChange={(e) => setForm({ ...form, fuelRate: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Meter Reading at Fill-up (KM)">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 48500"
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                />
              </FormField>
            </div>
          )}

          {/* GENERAL EXPENSE & DATE */}
          <div className="formTwoCol">
            <FormField label="Total Expense in PKR" required>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 7500"
                value={form.expense}
                onChange={(e) => setForm({ ...form, expense: e.target.value })}
              />
            </FormField>

            <FormField label="Date" required>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Additional Note (Optional)">
            <input
              type="text"
              placeholder="Any other notes or remarks..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </FormField>

          <div className="formActions">
            <Button variant="ghost" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingId ? 'Update Vehicle Record' : 'Save Vehicle Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Vehicle Expense"
        message={`Are you sure you want to delete this expense for ${deleteTarget?.name} (${formatPKR(deleteTarget?.expense)})?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
