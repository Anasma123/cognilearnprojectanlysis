'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { ProjectDocument, DocumentCategory } from '@/lib/types';
import { formatDateIndian, formatFileSize } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  FolderOpen,
  Image,
  Code,
  FileCode,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export default function DocumentsPage() {
  const { documents, colleges, groups, projects, uploadDocument, deleteDocument, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'proposal' as DocumentCategory,
    group_id: groups[0]?.id || '',
    project_id: projects[0]?.id || '',
    college_id: colleges[0]?.id || '',
    file_url: 'https://storage.cognilearn.org/documents/sample_document.pdf',
    file_name: 'MES_Project_Documentation.pdf',
    file_size: 1850000,
    file_type: 'application/pdf'
  });

  const filteredDocs = documents.filter(d =>
    selectedCategory === 'ALL' || d.category === selectedCategory
  );

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title) {
      alert('Please fill document title');
      return;
    }

    uploadDocument(uploadForm);
    setShowUploadModal(false);
  };

  const getCategoryIcon = (category: DocumentCategory) => {
    switch (category) {
      case 'screenshot':
      case 'database_diagram':
        return Image;
      case 'code':
        return Code;
      case 'certificate':
        return FileCheck;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Supabase Storage Repository
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Project Document Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hierarchical asset storage: College → Group → Project → Document Category.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'All Files' },
          { id: 'proposal', label: 'Proposals' },
          { id: 'requirement', label: 'SRS & Requirements' },
          { id: 'database_diagram', label: 'Database & Diagrams' },
          { id: 'weekly_report', label: 'Weekly Report PDFs' },
          { id: 'screenshot', label: 'UI Screenshots' },
          { id: 'code', label: 'Code Bundles' },
          { id: 'final_doc', label: 'Final Documentation' },
          { id: 'certificate', label: 'Certificates' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => {
          const Icon = getCategoryIcon(doc.category);
          const grp = groups.find(g => g.id === doc.group_id);

          return (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {doc.category.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{doc.file_name}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Group:</span>
                    <strong className="text-slate-800">{grp?.group_code || 'Cohort'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{formatDateIndian(doc.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View File
                </a>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Delete File Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowUploadModal(false)}
          title="Upload Project Document"
          subtitle="Upload deliverables to secure Supabase Storage bucket"
          maxWidth="2xl"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="e.g. Telemedicine SRS Functional Specifications v1.2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as DocumentCategory })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="proposal">Project Proposal</option>
                  <option value="requirement">Requirement Document (SRS)</option>
                  <option value="database_diagram">Database Diagram / Schema</option>
                  <option value="weekly_report">Weekly Report Attachment</option>
                  <option value="screenshot">UI / Screen Mockup</option>
                  <option value="code">Source Code Link / Archive</option>
                  <option value="presentation">Presentation PPT</option>
                  <option value="final_doc">Final Dissertation Documentation</option>
                  <option value="certificate">Certification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Project Group *
                </label>
                <select
                  value={uploadForm.group_id}
                  onChange={(e) => {
                    const prj = projects.find(p => p.group_id === e.target.value);
                    setUploadForm({
                      ...uploadForm,
                      group_id: e.target.value,
                      project_id: prj?.id || uploadForm.project_id
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulated file upload dropzone */}
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-[11px] text-slate-500">
                PDF, PNG, JPG, ZIP, DOCX up to 50MB (Stored in private Supabase bucket)
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Upload File Metadata
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
