'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { StaffMember } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import {
  UserCog,
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound
} from 'lucide-react';

export default function StaffPage() {
  const { staffMembers, addStaffMember, updateStaffMember, deleteStaffMember, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff',
    designation: 'Project Coordinator',
    department: 'Software Innovation Division',
    is_active: true
  });

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((m) => {
      const matchSearch = m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staffMembers, searchQuery, roleFilter]);

  const adminCount = useMemo(() => staffMembers.filter(s => s.role === 'admin').length, [staffMembers]);
  const staffCount = useMemo(() => staffMembers.filter(s => s.role === 'staff').length, [staffMembers]);
  const activeCount = useMemo(() => staffMembers.filter(s => s.is_active).length, [staffMembers]);

  const handleOpenAdd = () => {
    setStaffToEdit(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'staff',
      designation: 'Project Coordinator',
      department: 'Software Innovation Division',
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setStaffToEdit(staff);
    setFormData({
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      designation: staff.designation,
      department: staff.department || 'Software Innovation Division',
      is_active: staff.is_active
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      alert('Please fill all required fields');
      return;
    }

    if (staffToEdit) {
      updateStaffMember(staffToEdit.id, formData);
    } else {
      addStaffMember({
        ...formData,
        avatar_url: `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000)}?w=150`
      });
    }

    setShowAddModal(false);
  };

  const handleDeleteConfirm = () => {
    if (staffToDelete) {
      deleteStaffMember(staffToDelete.id);
      setStaffToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Internal Team & Access Control
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            Admins & Organization Staff
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage authorized staff coordinators, system administrators, and project supervisors.
          </p>
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Staff / Admin
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Team Members</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{staffMembers.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized officers</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 text-xs font-medium mb-1">
            <span>System Admins</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700">{adminCount}</div>
          <p className="text-[11px] text-purple-600 font-medium mt-1">Full access rights</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium mb-1">
            <span>Staff Coordinators</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700">{staffCount}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Project & cohort in-charge</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium mb-1">
            <span>Active Status</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Live operational accounts</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, designation..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff Coordinators</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg">
                    {staff.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{staff.full_name}</h3>
                    <p className="text-xs text-blue-700 font-medium">{staff.designation}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  staff.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {staff.role}
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.email}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{staff.department || 'Software Lab'}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-slate-500 font-medium">{staff.is_active ? 'Active' : 'Inactive'}</span>
              </div>

              {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors"
                    title="Edit Staff Member"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {staff.id !== 'staff-1' && (
                    <button
                      onClick={() => setStaffToDelete(staff)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Staff Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={staffToEdit ? 'Edit Staff Member' : 'Add Staff or Admin'}
        subtitle="Configure system permissions and operational roles"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="rahul@cognilearn.org"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="+91 98950 12345"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="admin">Administrator (Full Control)</option>
                <option value="staff">Staff / Project Coordinator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="e.g. Senior Project Coordinator"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="e.g. Software Innovation Division"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
              Account Active (Can log in and manage cohorts)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              {staffToEdit ? 'Save Changes' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Modal */}
      {staffToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setStaffToDelete(null)}
          title="Confirm Staff Removal"
          subtitle="Revoke system access and remove profile"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{staffToDelete.full_name}</strong> ({staffToDelete.email}) from staff records?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Delete Staff Member
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
