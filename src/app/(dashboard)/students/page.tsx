'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Student } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { exportStudentsToExcel } from '@/lib/utils/exportExcel';
import { generateStudentProfilePdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StudentModal } from '@/components/students/StudentModal';
import {
  Search,
  Plus,
  FileSpreadsheet,
  FileDown,
  Edit,
  Trash2,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Building,
  Users
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function StudentsPage() {
  const { students, deleteStudent, colleges, courses, groups, payments, currentUser } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter((s) => {
      if (!s) return false;
      const fullName = (s.full_name || '').toLowerCase();
      const regNo = String(s.student_reg_no || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const role = (s.assigned_role || '').toLowerCase();
      const query = (searchTerm || '').trim().toLowerCase();

      const matchSearch =
        !query ||
        fullName.includes(query) ||
        regNo.includes(query) ||
        email.includes(query) ||
        role.includes(query);

      const matchCollege = selectedCollege === 'ALL' || s.college_id === selectedCollege;
      const matchCourse = selectedCourse === 'ALL' || s.course_id === selectedCourse;
      const matchGroup = selectedGroup === 'ALL' || s.group_id === selectedGroup;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchCollege && matchCourse && matchGroup && matchStatus;
    });
  }, [students, searchTerm, selectedCollege, selectedCourse, selectedGroup, selectedStatus]);

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Total Enrolled: {students.length} Students
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            MES College Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage academic profiles, group assignments, attendance, and evaluation dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'staff' || currentUser?.role === 'mentor') && (
            <button
              onClick={() => { setStudentToEdit(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Enroll Student
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, reg no, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Filter by College */}
          <div>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Colleges</option>
              {(colleges || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Group */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Project Groups</option>
              {(groups || []).map((g) => (
                <option key={g.id} value={g.id}>{g.group_code}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_leave">On Leave</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Student Profile</th>
                <th className="py-3.5 px-4">Reg Number</th>
                <th className="py-3.5 px-4">College & Course</th>
                <th className="py-3.5 px-4">Group & Role</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={student.full_name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{student.full_name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Reg No */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {student.student_reg_no}
                    </td>

                    {/* College & Course */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{student.college?.name || 'MES College'}</p>
                      <p className="text-[11px] text-slate-500">{student.course?.name || student.department}</p>
                    </td>

                    {/* Group & Role */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700">
                          {student.group?.group_code || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {student.assigned_role}
                        </span>
                        {(() => {
                          const pay = (payments || []).find(p => p.student_id === student.id);
                          return (
                            <span className={`inline-block w-fit text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              pay?.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                              pay?.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              Fee: {pay?.status === 'paid' ? 'Paid' : `Due ₹${pay?.balance_amount ?? 5000}`}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 text-slate-600">
                      {formatDateIndian(student.joining_date)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={student.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingStudent(student)}
                          title="View Profile Dossier"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateStudentProfilePdf(student)}
                          title="Download Profile PDF"
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
                          <>
                            <button
                              onClick={() => { setStudentToEdit(student); setShowAddModal(true); }}
                              title="Edit Student"
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(student)}
                              title="Delete Student"
                              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setStudentToEdit(null); }}
        studentToEdit={studentToEdit}
      />

      {/* View Student Dossier Modal */}
      {viewingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudent(null)}
          title={`Student Profile: ${viewingStudent.full_name}`}
          subtitle={`Register Number: ${viewingStudent.student_reg_no}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <img
                src={viewingStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={viewingStudent.full_name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{viewingStudent.full_name}</h3>
                  <StatusBadge status={viewingStudent.status} />
                </div>
                <p className="text-xs text-blue-700 font-semibold">{viewingStudent.assigned_role}</p>
                <p className="text-xs text-slate-500 mt-1">{viewingStudent.college?.name || 'MES College'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Email</span>
                <span className="font-semibold text-slate-800">{viewingStudent.email}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Phone</span>
                <span className="font-semibold text-slate-800">{viewingStudent.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Course & Department</span>
                <span className="font-semibold text-slate-800">{viewingStudent.course?.name || viewingStudent.department || 'N/A'}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Class / Academic Year</span>
                <span className="font-semibold text-slate-800">{viewingStudent.class_year}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Assigned Group</span>
                <span className="font-semibold text-blue-700">{viewingStudent.group?.group_code || 'Unassigned'}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Joining Date</span>
                <span className="font-semibold text-slate-800">{formatDateIndian(viewingStudent.joining_date)}</span>
              </div>
            </div>

            {viewingStudent.notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">Mentor Remarks & Skills:</span>
                <p className="text-amber-800 leading-relaxed">{viewingStudent.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => generateStudentProfilePdf(viewingStudent)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Generate Student Profile PDF
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setStudentToDelete(null)}
          title="Confirm Student Deletion"
          subtitle="Permanent database action"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete student <strong className="text-slate-900">{studentToDelete.full_name}</strong> ({studentToDelete.student_reg_no})? All associated tasks and records will be unlinked.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Delete Student
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
