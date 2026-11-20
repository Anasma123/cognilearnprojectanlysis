'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Student, StudentStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { Plus, Building2, BookOpen } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export function StudentModal({ isOpen, onClose, studentToEdit }: StudentModalProps) {
  const { colleges, courses, groups, students, addStudent, updateStudent, addCollege, addCourse } = useApp();

  // Helper to compute next unique sequential student ID: 1, 2, 3...
  const computeNextStudentId = () => {
    const nums = (students || [])
      .map(s => s && s.student_reg_no ? parseInt(String(s.student_reg_no), 10) : NaN)
      .filter(n => !isNaN(n) && n > 0);
    return nums.length > 0 ? String(Math.max(...nums) + 1) : String((students?.length || 0) + 1);
  };

  const [formData, setFormData] = useState({
    student_reg_no: '1',
    full_name: '',
    email: '',
    phone: '',
    college_id: '',
    course_id: '',
    department: '',
    class_year: 'Final Year',
    group_id: '',
    assigned_role: 'Full-Stack Developer',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'active' as StudentStatus,
    notes: '',
    avatar_url: '',
    total_fee: 5000,
    paid_amount: 0
  });

  // State for typing custom college/department on the fly
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');

  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        student_reg_no: studentToEdit.student_reg_no,
        full_name: studentToEdit.full_name,
        email: studentToEdit.email,
        phone: studentToEdit.phone || '',
        college_id: studentToEdit.college_id,
        course_id: studentToEdit.course_id,
        department: studentToEdit.department || '',
        class_year: studentToEdit.class_year,
        group_id: studentToEdit.group_id || '',
        assigned_role: studentToEdit.assigned_role || 'Full-Stack Developer',
        joining_date: studentToEdit.joining_date,
        status: studentToEdit.status,
        notes: studentToEdit.notes || '',
        avatar_url: studentToEdit.avatar_url || '',
        total_fee: studentToEdit.total_fee || 5000,
        paid_amount: studentToEdit.paid_amount || 0
      });
      setIsCustomCollege(false);
      setIsCustomCourse(false);
    } else {
      const nextId = computeNextStudentId();
      const defaultCollege = colleges[0]?.id || '';
      const defaultCourse = courses[0]?.id || '';

      setFormData({
        student_reg_no: nextId,
        full_name: '',
        email: '',
        phone: '',
        college_id: defaultCollege,
        course_id: defaultCourse,
        department: '',
        class_year: 'Final Year',
        group_id: '',
        assigned_role: 'Full-Stack Developer',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        total_fee: 5000,
        paid_amount: 0
      });

      // If no colleges or courses exist, default to custom input mode
      setIsCustomCollege(colleges.length === 0);
      setIsCustomCourse(courses.length === 0);
      setCustomCollegeName('');
      setCustomCourseName('');
    }
  }, [studentToEdit, isOpen, colleges, courses, groups, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      alert('Please fill student name and email');
      return;
    }

    let finalCollegeId = formData.college_id;
    if (isCustomCollege || !finalCollegeId) {
      if (!customCollegeName.trim()) {
        alert('Please enter college name');
        return;
      }
      const newCol = addCollege(customCollegeName.trim());
      finalCollegeId = newCol.id;
    }

    let finalCourseId = formData.course_id;
    const deptName = formData.department.trim() || customCourseName.trim() || 'General';
    if (isCustomCourse || !finalCourseId) {
      if (!customCourseName.trim()) {
        alert('Please enter department / course name');
        return;
      }
      const newCrs = addCourse(customCourseName.trim(), deptName, finalCollegeId);
      finalCourseId = newCrs.id;
    }

    const payload = {
      ...formData,
      college_id: finalCollegeId,
      course_id: finalCourseId,
      department: deptName,
      student_reg_no: formData.student_reg_no.trim() || computeNextStudentId()
    };

    if (studentToEdit) {
      updateStudent(studentToEdit.id, payload);
    } else {
      addStudent(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? 'Edit Student Profile' : 'Enroll New Academic Student'}
      subtitle="Sequential ID, College Affiliation & Fee Configuration"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sequential Student ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Student ID / Reg No *
              </label>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded">
                Auto-assigned: {formData.student_reg_no}
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.student_reg_no}
              onChange={(e) => setFormData({ ...formData, student_reg_no: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. 1, 2, 3..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. rahul@example.com"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="+91 98950 12345"
            />
          </div>

          {/* College Section - Select or Add new */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                College Affiliation *
              </label>
              {colleges.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomCollege(!isCustomCollege)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isCustomCollege ? '← Choose Existing' : '+ Add New College'}
                </button>
              )}
            </div>

            {isCustomCollege || colleges.length === 0 ? (
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customCollegeName}
                  onChange={(e) => setCustomCollegeName(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  placeholder="Enter College Name (e.g. MES College of Engineering)"
                />
              </div>
            ) : (
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Course / Department Section - Select or Add new */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Department / Course *
              </label>
              {courses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomCourse(!isCustomCourse)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isCustomCourse ? '← Choose Existing' : '+ Add Department'}
                </button>
              )}
            </div>

            {isCustomCourse || courses.length === 0 ? (
              <input
                type="text"
                required
                value={customCourseName}
                onChange={(e) => {
                  setCustomCourseName(e.target.value);
                  setFormData(f => ({ ...f, department: e.target.value }));
                }}
                className="w-full px-3 py-2 border border-blue-300 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                placeholder="Enter Department (e.g. Computer Science)"
              />
            ) : (
              <select
                value={formData.course_id}
                onChange={(e) => {
                  const crs = courses.find(c => c.id === e.target.value);
                  setFormData({ ...formData, course_id: e.target.value, department: crs?.department || crs?.name || '' });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class / Year *
            </label>
            <input
              type="text"
              required
              value={formData.class_year}
              onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Final Year / Semester 8"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Project Group
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="">-- No Group (Can cluster later) --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Project Role *
            </label>
            <input
              type="text"
              required
              value={formData.assigned_role}
              onChange={(e) => setFormData({ ...formData, assigned_role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Team Leader / Developer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Joining Date *
            </label>
            <input
              type="date"
              required
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_leave">On Leave</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Course / Project Fee (₹) *
            </label>
            <input
              type="number"
              min="0"
              value={formData.total_fee}
              onChange={(e) => setFormData({ ...formData, total_fee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Paid Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.paid_amount}
              onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono text-emerald-600"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Special project skills, observations..."
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            {studentToEdit ? 'Save Changes' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
