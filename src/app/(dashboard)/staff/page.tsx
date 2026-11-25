'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import {
  StaffMember,
  StaffPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS
} from '@/lib/types';
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
  KeyRound,
  ShieldAlert,
  GraduationCap,
  Users,
  FolderKanban,
  CalendarDays,
  ListTodo,
  CreditCard,
  FileBarChart,
  CalendarCheck2,
  Check
} from 'lucide-react';

const PERMISSION_CONFIG: Array<{
  key: keyof StaffPermissions;
  label: string;
  description: string;
  icon: any;
}> = [
  {
    key: 'manage_students',
    label: 'Manage Students',
    description: 'Enroll new students, modify academic profiles, manage roster',
    icon: GraduationCap
  },
  {
    key: 'manage_groups',
    label: 'Manage Cohorts & Groups',
    description: 'Create project teams, appoint team leaders & allocate cohorts',
    icon: Users
  },
  {
    key: 'manage_projects',
    label: 'Manage Projects & 13 Stages',
    description: 'Oversee project lifecycle, verify 4 phases & monitor milestones',
    icon: FolderKanban
  },
  {
    key: 'mark_attendance',
    label: 'Mark Lab Attendance',
    description: 'Record daily lab check-ins, batch attendance & mark absences',
    icon: CalendarDays
  },
  {
    key: 'assign_tasks',
    label: 'Assign Tasks & Deliverables',
    description: 'Delegate cohort broadcast tasks and individual assignments',
    icon: ListTodo
  },
  {
    key: 'record_payments',
    label: 'Record Fee Payments',
    description: 'Manage tuition collections, record UPI/Cash & print receipts',
    icon: CreditCard
  },
  {
    key: 'export_reports',
    label: 'Academic Reports & PDFs',
    description: 'Download filtered group/student dossiers & Excel audit records',
    icon: FileBarChart
  },
  {
    key: 'mentor_reviews',
    label: 'Weekly Reviews & Feedback',
    description: 'Audit weekly progress reports and publish mentor evaluation remarks',
    icon: CalendarCheck2
  }
];

export default function StaffPage() {
  const { staffMembers, addStaffMember, updateStaffMember, deleteStaffMember, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Form State with Granular Feature Toggles
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff',
    designation: 'Project Coordinator',
    department: 'Software Innovation Division',
    is_active: true,
    permissions: { ...DEFAULT_STAFF_PERMISSIONS }
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
      is_active: true,
      permissions: { ...DEFAULT_STAFF_PERMISSIONS }
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setStaffToEdit(staff);
    const existingPerms = staff.permissions || (staff.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS);
    setFormData({
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      designation: staff.designation,
      department: staff.department || 'Software Innovation Division',
      is_active: staff.is_active,
      permissions: { ...existingPerms }
    });
    setShowAddModal(true);
  };

  const handleRoleChange = (newRole: 'admin' | 'staff') => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      designation: newRole === 'admin' ? 'System Administrator' : (prev.designation === 'System Administrator' ? 'Project Coordinator' : prev.designation),
      permissions: newRole === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_STAFF_PERMISSIONS }
    }));
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleToggleAllPermissions = (enable: boolean) => {
    const updated: StaffPermissions = {
      manage_students: enable,
      manage_groups: enable,
      manage_projects: enable,
      mark_attendance: enable,
      assign_tasks: enable,
      record_payments: enable,
      export_reports: enable,
      mentor_reviews: enable
    };
    setFormData(prev => ({ ...prev, permissions: updated }));
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

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only System Administrators have authorization to manage staff accounts, credentials, and access permissions.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

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

              {/* Assigned Permissions Badges */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Allowed Functions
                  </span>
                  {staff.role === 'staff' && (
                    <span className="text-[10px] font-semibold text-blue-600">
                      {PERMISSION_CONFIG.filter(p => staff.permissions?.[p.key] !== false).length} / 8 active
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {staff.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      <ShieldCheck className="w-3 h-3 text-purple-600" /> Full Administrator Access
                    </span>
                  ) : (
                    PERMISSION_CONFIG.filter(p => staff.permissions?.[p.key] !== false).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No functions permitted</span>
                    ) : (
                      PERMISSION_CONFIG.filter(p => staff.permissions?.[p.key] !== false).map(p => {
                        const Icon = p.icon;
                        return (
                          <span
                            key={p.key}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100"
                          >
                            <Icon className="w-2.5 h-2.5" />
                            {p.label}
                          </span>
                        );
                      })
                    )
                  )}
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
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Edit Staff Member"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {staff.id !== 'staff-1' && staff.id !== 'staff-admin-01' && (
                    <button
                      onClick={() => setStaffToDelete(staff)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

      {/* Add / Edit Modal with Permission Toggles */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={staffToEdit ? `Edit Staff Member (${staffToEdit.full_name})` : 'Add Staff or Administrator'}
        subtitle="Configure profile details and toggle granular operational permissions"
        maxWidth="2xl"
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
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="staff">Staff / Project Coordinator</option>
                <option value="admin">Administrator (Full Control)</option>
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

          <div className="flex items-center gap-2 pt-1 pb-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              Account Active (Can log in and access system)
            </label>
          </div>

          {/* Granular Permission Toggles Section */}
          <div className="pt-3 border-t border-slate-200">
            {formData.role === 'admin' ? (
              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Administrator - Full Master Control</h4>
                  <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                    System Administrators have full unrestricted access to all student rosters, project cohorts, financial records, staff permissions, and settings.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Staff / Coordinator Allowed Functions
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Toggle the operational modules this staff coordinator is authorized to access
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAllPermissions(true)}
                      className="px-2 py-1 rounded text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllPermissions(false)}
                      className="px-2 py-1 rounded text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {PERMISSION_CONFIG.map((p) => {
                    const Icon = p.icon;
                    const isEnabled = Boolean(formData.permissions[p.key]);

                    return (
                      <div
                        key={p.key}
                        onClick={() => togglePermission(p.key)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isEnabled
                            ? 'bg-blue-50/70 border-blue-200 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 pr-2">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isEnabled ? 'text-blue-950' : 'text-slate-700'}`}>
                              {p.label}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </div>

                        {/* iOS style Toggle Switch */}
                        <div
                          className={`shrink-0 w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
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
