'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Group, GroupStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { Users, UserCheck, ShieldCheck, Search, CheckSquare, Square, Lock, AlertCircle } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupToEdit?: Group | null;
}

export function GroupModal({ isOpen, onClose, groupToEdit }: GroupModalProps) {
  const { colleges, courses, staffMembers, students, groups, allStudents, allGroups, currentUser, createGroup, updateGroup, addCollege, addCourse } = useApp();

  const [formData, setFormData] = useState({
    group_code: '',
    name: '',
    college_id: '',
    course_id: '',
    class_year: 'Final Year',
    mentor_id: staffMembers[0]?.id || '',
    coordinator_name: staffMembers[0]?.full_name || 'Admin Coordinator',
    group_leader_id: '',
    project_title: '',
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: '2025-04-30',
    status: 'active' as GroupStatus
  });

  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState('');

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'available' | 'all' | 'selected'>('available');

  useEffect(() => {
    if (!isOpen) return;

    if (groupToEdit) {
      const currentMemberIds = groupToEdit.member_ids ||
        students.filter(s => s.group_id === groupToEdit.id).map(s => s.id);

      setFormData({
        group_code: groupToEdit.group_code,
        name: groupToEdit.name,
        college_id: groupToEdit.college_id,
        course_id: groupToEdit.course_id,
        class_year: groupToEdit.class_year,
        mentor_id: groupToEdit.mentor_id || staffMembers[0]?.id || '',
        coordinator_name: groupToEdit.coordinator_name || staffMembers[0]?.full_name || '',
        group_leader_id: groupToEdit.group_leader_id || '',
        project_title: groupToEdit.project_title || '',
        start_date: groupToEdit.start_date,
        expected_completion_date: groupToEdit.expected_completion_date,
        status: groupToEdit.status
      });
      setSelectedStudentIds(currentMemberIds);
    } else {
      const defaultStaff = (currentUser.role === 'staff')
        ? (staffMembers.find(s => s.id === currentUser.id || s.email === currentUser.email) || staffMembers[0])
        : staffMembers[0];

      setFormData({
        group_code: `GRP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        college_id: colleges[0]?.id || '',
        course_id: courses[0]?.id || '',
        class_year: 'Final Year (Semester 8)',
        mentor_id: defaultStaff?.id || '',
        coordinator_name: defaultStaff?.full_name || 'Admin Coordinator',
        group_leader_id: '',
        project_title: '',
        start_date: new Date().toISOString().split('T')[0],
        expected_completion_date: '2025-04-30',
        status: 'active'
      });
      setSelectedStudentIds([]);
    }
    setStudentSearch('');
  }, [groupToEdit, isOpen]);

  // Check if a student already belongs to another group (excluding current editing group)
  const getStudentEnrolledGroup = (studentId: string) => {
    const groupList = allGroups || groups || [];
    const studentList = allStudents || students || [];
    return groupList.find(g => {
      if (groupToEdit && g.id === groupToEdit.id) return false;
      const isMember = Array.isArray(g.member_ids) && g.member_ids.includes(studentId);
      const studentObj = studentList.find(s => s.id === studentId);
      const isDirectGroup = studentObj?.group_id === g.id && (!groupToEdit || g.id !== groupToEdit.id);
      return isMember || isDirectGroup;
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    const enrolledOther = getStudentEnrolledGroup(studentId);
    if (enrolledOther) {
      alert(`Student is already assigned to "${enrolledOther.name} (${enrolledOther.group_code})". Students existing in a group are not allowed to be part of another group.`);
      return;
    }

    setSelectedStudentIds(prev => {
      const exists = prev.includes(studentId);
      const updated = exists ? prev.filter(id => id !== studentId) : [...prev, studentId];

      // If removed student was the leader, reset leader
      if (exists && formData.group_leader_id === studentId) {
        setFormData(f => ({ ...f, group_leader_id: updated[0] || '' }));
      } else if (!exists && updated.length === 1 && !formData.group_leader_id) {
        // Auto assign first selected as default leader
        setFormData(f => ({ ...f, group_leader_id: studentId }));
      }

      return updated;
    });
  };

  const handleCoordinatorChange = (staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    setFormData(f => ({
      ...f,
      mentor_id: staffId,
      coordinator_name: staff ? `${staff.full_name}` : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter group name');
      return;
    }

    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student. A group must have assigned students to activate and maintain a project.');
      return;
    }

    const conflictingStudents = selectedStudentIds.filter(id => !!getStudentEnrolledGroup(id));
    if (conflictingStudents.length > 0) {
      alert('Some selected students already belong to another group. Students existing in a group cannot be part of another group.');
      return;
    }

    let finalCollegeId = formData.college_id;
    if (isCustomCollege || !finalCollegeId) {
      if (customCollegeName.trim()) {
        const newCol = addCollege(customCollegeName.trim());
        finalCollegeId = newCol.id;
      }
    }

    let finalCourseId = formData.course_id;
    if (isCustomCourse || !finalCourseId) {
      if (customCourseName.trim()) {
        const newCrs = addCourse(customCourseName.trim(), customCourseName.trim(), finalCollegeId);
        finalCourseId = newCrs.id;
      }
    }

    // Auto-generate group code if not present
    const groupCode = formData.group_code || `GRP-${Math.floor(100 + Math.random() * 900)}`;

    // Auto-calculate expected completion date if not present (default: 6 months from start date)
    let expectedDate = formData.expected_completion_date;
    if (!expectedDate) {
      const sDate = new Date(formData.start_date || Date.now());
      sDate.setMonth(sDate.getMonth() + 6);
      expectedDate = sDate.toISOString().split('T')[0];
    }

    const payload = {
      ...formData,
      group_code: groupCode,
      expected_completion_date: expectedDate,
      college_id: finalCollegeId,
      course_id: finalCourseId,
      member_ids: selectedStudentIds
    };

    if (groupToEdit) {
      updateGroup(groupToEdit.id, payload);
    } else {
      createGroup(payload);
    }
    onClose();
  };

  const availableStudentsCount = useMemo(() => {
    const list = allStudents || students || [];
    return list.filter(s => !getStudentEnrolledGroup(s.id)).length;
  }, [students, allStudents, groups, allGroups, groupToEdit]);

  // Filter students for the selector
  const availableStudents = useMemo(() => {
    const list = allStudents || students || [];
    return list.filter(s => {
      const matchesSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.student_reg_no.toLowerCase().includes(studentSearch.toLowerCase());
      if (!matchesSearch) return false;

      const enrolledOther = getStudentEnrolledGroup(s.id);
      if (filterMode === 'available') {
        return !enrolledOther;
      }
      if (filterMode === 'selected') {
        return selectedStudentIds.includes(s.id);
      }
      return true;
    });
  }, [students, allStudents, studentSearch, filterMode, selectedStudentIds, groups, allGroups, groupToEdit]);

  const selectedStudents = useMemo(() => {
    const list = allStudents || students || [];
    return list.filter(s => selectedStudentIds.includes(s.id));
  }, [allStudents, students, selectedStudentIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={groupToEdit ? 'Edit Project Group' : 'Form New Project Group'}
      subtitle="Select enrolled students and configure group project details"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Team Alpha / Smart Healthcare"
            />
          </div>

          {/* College Section */}
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
                  {isCustomCollege ? '← Choose Existing' : '+ Add College'}
                </button>
              )}
            </div>

            {isCustomCollege || colleges.length === 0 ? (
              <input
                type="text"
                required
                value={customCollegeName}
                onChange={(e) => setCustomCollegeName(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                placeholder="Enter College Name"
              />
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

          {/* Course Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Course / Department *
              </label>
              {courses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomCourse(!isCustomCourse)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isCustomCourse ? '← Choose Existing' : '+ Add Course'}
                </button>
              )}
            </div>

            {isCustomCourse || courses.length === 0 ? (
              <input
                type="text"
                required
                value={customCourseName}
                onChange={(e) => setCustomCourseName(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                placeholder="Enter Course (e.g. B.Tech CSE)"
              />
            ) : (
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
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
              Staff / Admin In-Charge *
            </label>
            <select
              value={formData.mentor_id}
              onChange={(e) => handleCoordinatorChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.designation} - {s.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Appointed Group Leader
            </label>
            <select
              value={formData.group_leader_id}
              onChange={(e) => setFormData({ ...formData, group_leader_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="">-- Choose From Selected Members --</option>
              {selectedStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_reg_no})</option>
              ))}
            </select>
            {selectedStudents.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">Select students below to appoint a leader</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. AI-Powered Medical Records & Diagnostic Support Engine"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        {/* Student Multi-Selection Section */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Group Members ({selectedStudentIds.length} Selected)
              </label>
              <p className="text-[11px] text-slate-500">
                Students can only belong to one group. Students already assigned to other groups are locked.
              </p>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Filter students..."
                className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => setFilterMode('available')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filterMode === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Available ({availableStudentsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('selected')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filterMode === 'selected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Selected ({selectedStudentIds.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Students ({students.length})
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
            {availableStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {students.length === 0
                  ? 'No students enrolled yet. Please add students first.'
                  : filterMode === 'available'
                  ? 'No unassigned students available. All students already belong to groups.'
                  : 'No matching students found.'}
              </div>
            ) : (
              availableStudents.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                const isLeader = formData.group_leader_id === student.id;
                const enrolledOther = getStudentEnrolledGroup(student.id);

                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`p-2.5 px-3 flex items-center justify-between transition-colors text-xs ${
                      enrolledOther
                        ? 'bg-slate-100/70 opacity-60 cursor-not-allowed select-none'
                        : isSelected
                        ? 'bg-blue-50/80 cursor-pointer hover:bg-blue-100/60'
                        : 'cursor-pointer hover:bg-white'
                    }`}
                    title={enrolledOther ? `Already assigned to ${enrolledOther.name} (${enrolledOther.group_code})` : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={enrolledOther ? 'text-slate-400' : 'text-blue-600'}>
                        {enrolledOther ? (
                          <Lock className="w-4 h-4 text-slate-400" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <img
                        src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={student.full_name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className={`font-bold ${enrolledOther ? 'text-slate-600' : 'text-slate-900'}`}>{student.full_name}</span>
                        <span className="text-[11px] text-slate-500 ml-2 font-mono">{student.student_reg_no}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLeader && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Leader
                        </span>
                      )}
                      {enrolledOther && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-300">
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          Assigned: {enrolledOther.group_code || enrolledOther.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
            {groupToEdit ? 'Save Group' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
