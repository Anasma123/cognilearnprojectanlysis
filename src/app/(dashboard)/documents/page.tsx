'use client';

import React, { useState, useRef } from 'react';
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
  Search,
  CheckCircle,
  FileCode,
  FileCheck,
  FolderOpen
} from 'lucide-react';

export default function DocumentsPage() {
  const { documents, colleges, groups, projects, uploadDocument, deleteDocument, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'proposal' as DocumentCategory,
    group_id: groups[0]?.id || '',
    project_id: projects[0]?.id || '',
    college_id: colleges[0]?.id || '',
    file_url: '',
    file_name: '',
    file_size: 0,
    file_type: 'application/pdf'
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    const inferredTitle = uploadForm.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    setUploadForm(prev => ({
      ...prev,
      title: inferredTitle,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || 'application/pdf',
      file_url: objectUrl
    }));
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      alert('Please provide a document title.');
      return;
    }

    if (!selectedFile && !uploadForm.file_url) {
      alert('Please browse and select a file to upload.');
      return;
    }

    uploadDocument(uploadForm);
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadForm({
      title: '',
      category: 'proposal',
      group_id: groups[0]?.id || '',
      project_id: projects[0]?.id || '',
      college_id: colleges[0]?.id || '',
      file_url: '',
      file_name: '',
      file_size: 0,
      file_type: 'application/pdf'
    });
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = !searchTerm ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'ALL' || d.group_id === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Project Document Repository
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Project Deliverables & Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Store and manage academic deliverables, reports, architectures, and project artifacts.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedFile(null);
            setShowUploadModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Project Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No project documents found matching your criteria.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const grp = groups.find(g => g.id === doc.group_id);

            return (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{doc.file_name}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Group:</span>
                      <strong className="text-slate-800">{grp?.name || 'Cohort'}</strong>
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
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View File
                  </a>

                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete File Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowUploadModal(false)}
          title="Upload Project Document"
          subtitle="Select and upload project deliverables"
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
                placeholder="e.g. Telemedicine Functional Specifications v1.0"
              />
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
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Hidden Real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.ppt,.pptx,.txt"
            />

            {/* Interactive File Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-xl text-center space-y-2 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-1">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {formatFileSize(selectedFile.size)} • Click to replace file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse or drag and drop your document here
                  </p>
                  <p className="text-[11px] text-slate-500">
                    PDF, DOCX, ZIP, PPT, PNG, JPG supported (up to 50MB)
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                Upload Document
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
