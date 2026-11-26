'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Group } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { exportGroupsToExcel } from '@/lib/utils/exportExcel';
import { generateGroupSummaryPdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { GroupModal } from '@/components/groups/GroupModal';
import { GroupCommandHubModal } from '@/components/groups/GroupCommandHubModal';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  FileSpreadsheet,
  FileDown,
  Edit,
  Trash2,
  FolderKanban,
  UserCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function GroupsPage() {
  const { groups, projects, weeklyReports, deleteGroup, currentUser } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const handleDeleteConfirm = () => {
    if (groupToDelete) {
      deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Total Cohorts: {groups.length} Academic Groups
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Project Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Academic project cohorts, student leader assignments, staff coordinators, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportGroupsToExcel(groups)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
            <button
              onClick={() => { setGroupToEdit(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Form Group
            </button>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No project groups created yet. Click &ldquo;Form Group&rdquo; above to create the first cohort.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
          const project = projects.find(p => p.group_id === group.id);
          const groupWeekly = weeklyReports.filter(w => w.group_id === group.id);

          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Top Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-bold font-mono">
                    {group.group_code}
                  </span>
                  <StatusBadge status={group.status} />
                </div>

                {/* Group Name & Project Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {group.name}
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-1 line-clamp-2">
                  {group.project_title || project?.title || 'No Project Assigned'}
                </p>

                {/* Meta details */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">College:</span>
                    <span className="font-semibold text-slate-800">{group.college?.code || group.college?.name || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Staff In-Charge:</span>
                    <span className="font-semibold text-blue-700">{group.coordinator_name || group.mentor?.full_name || 'Staff'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Group Leader:</span>
                    <span className="font-semibold text-slate-800">{group.leader?.full_name || 'Appointed'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Members Count:</span>
                    <span className="font-semibold text-slate-800">{group.members?.length || 0} Students</span>
                  </div>
                </div>

                {/* Progress bar */}
                {project && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <span className="font-bold text-emerald-600">{project.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewingGroup(group)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  360° Command Hub
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => generateGroupSummaryPdf(group, project, groupWeekly)}
                    title="Export Group Dossier PDF"
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                    <>
                      <button
                        onClick={() => { setGroupToEdit(group); setShowAddModal(true); }}
                        title="Edit Group"
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGroupToDelete(group)}
                        title="Delete Group"
                        className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Group Modal */}
      <GroupModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setGroupToEdit(null); }}
        groupToEdit={groupToEdit}
      />

      {/* 360° Group Command Hub Modal */}
      {viewingGroup && (
        <GroupCommandHubModal
          isOpen={true}
          onClose={() => setViewingGroup(null)}
          group={viewingGroup}
        />
      )}

      {/* Delete Group Modal */}
      {groupToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setGroupToDelete(null)}
          title="Confirm Group Deletion"
          subtitle="Permanent database action"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete group <strong className="text-slate-900">{groupToDelete.name}</strong> ({groupToDelete.group_code})?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Delete Group
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
