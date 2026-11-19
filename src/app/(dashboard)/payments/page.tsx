'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { PaymentStatus, PaymentMode, StudentPayment } from '@/lib/types';
import { formatCurrencyIndian, formatDateIndian } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  Receipt,
  UserCheck,
  Building2,
  Calendar,
  History,
  Printer
} from 'lucide-react';

export default function PaymentsPage() {
  const { students, groups, payments, recordPayment, updatePayment, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // Modals state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [totalFeeInput, setTotalFeeInput] = useState<number>(5000);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // History modal
  const [viewingHistoryPayment, setViewingHistoryPayment] = useState<StudentPayment | null>(null);

  // Compute summary stats
  const totalAssessed = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.total_fee || 0), 0);
  }, [payments]);

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
  }, [payments]);

  const totalOutstanding = useMemo(() => {
    return Math.max(0, totalAssessed - totalCollected);
  }, [totalAssessed, totalCollected]);

  const fullyPaidCount = useMemo(() => {
    return payments.filter(p => p.status === 'paid').length;
  }, [payments]);

  const partialPaidCount = useMemo(() => {
    return payments.filter(p => p.status === 'partial').length;
  }, [payments]);

  const unpaidCount = useMemo(() => {
    return payments.filter(p => p.status === 'unpaid').length;
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const studentName = item.student?.full_name?.toLowerCase() || '';
      const regNo = item.student?.student_reg_no?.toLowerCase() || '';
      const receipt = item.receipt_no?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = studentName.includes(query) || regNo.includes(query) || receipt.includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesGroup = groupFilter === 'all' || item.group_id === groupFilter || item.student?.group_id === groupFilter;

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [payments, searchQuery, statusFilter, groupFilter]);

  // Prepare open record modal
  const handleOpenRecordModal = (prefillStudentId?: string) => {
    const studentId = prefillStudentId || (students[0]?.id || '');
    setSelectedStudentForPayment(studentId);

    const existingPayment = payments.find(p => p.student_id === studentId);
    const total = existingPayment ? existingPayment.total_fee : 5000;
    const balance = existingPayment ? existingPayment.balance_amount : 5000;

    setTotalFeeInput(total);
    setPaymentAmount(balance > 0 ? balance : 1000);
    setPaymentMode('upi');
    setReceiptNo(`REC-${Date.now().toString().slice(-6)}`);
    setRemarks('');
    setShowRecordModal(true);
  };

  const handleStudentChange = (id: string) => {
    setSelectedStudentForPayment(id);
    const existing = payments.find(p => p.student_id === id);
    if (existing) {
      setTotalFeeInput(existing.total_fee);
      setPaymentAmount(existing.balance_amount > 0 ? existing.balance_amount : 0);
    } else {
      setTotalFeeInput(5000);
      setPaymentAmount(5000);
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) {
      alert('Please select a student');
      return;
    }
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }

    const st = students.find(s => s.id === selectedStudentForPayment);

    recordPayment({
      student_id: selectedStudentForPayment,
      group_id: st?.group_id,
      total_fee: Number(totalFeeInput),
      amount: Number(paymentAmount),
      payment_mode: paymentMode,
      receipt_no: receiptNo.trim() || undefined,
      remarks: remarks.trim() || undefined
    });

    setShowRecordModal(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      alert('No payment records to export');
      return;
    }

    const headers = [
      'Student Name',
      'Register No',
      'Group',
      'College',
      'Total Fee (INR)',
      'Paid Amount (INR)',
      'Balance (INR)',
      'Status',
      'Payment Mode',
      'Receipt No',
      'Last Payment Date'
    ];

    const rows = payments.map(p => [
      `"${p.student?.full_name || 'N/A'}"`,
      `"${p.student?.student_reg_no || 'N/A'}"`,
      `"${p.group?.name || p.student?.group?.name || 'Unassigned'}"`,
      `"${p.student?.college?.name || 'MES College'}"`,
      p.total_fee,
      p.paid_amount,
      p.balance_amount,
      p.status.toUpperCase(),
      p.payment_mode?.toUpperCase() || 'N/A',
      `"${p.receipt_no || 'N/A'}"`,
      p.last_payment_date ? formatDateIndian(p.last_payment_date) : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cognilearn_Student_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              Student Fee Management Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
            Student Payments & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time individual student fee accounting, receipts, transaction history, and balance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Ledger (CSV)
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => handleOpenRecordModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Assessed Fee</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrencyIndian(totalAssessed)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on {payments.length} enrolled students
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium mb-1">
            <span>Total Fee Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrencyIndian(totalCollected)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {totalAssessed > 0 ? Math.round((totalCollected / totalAssessed) * 100) : 0}% Collection Efficiency
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-medium mb-1">
            <span>Outstanding Balance</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {formatCurrencyIndian(totalOutstanding)}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            {partialPaidCount + unpaidCount} student balances pending
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium mb-1">
            <span>Settled Students</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {fullyPaidCount} <span className="text-xs font-normal text-slate-500">/ {payments.length}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-emerald-700 font-bold">{fullyPaidCount} Paid</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-bold">{partialPaidCount} Partial</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">{unpaidCount} Unpaid</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, reg no, or receipt #..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid / Due</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none"
          >
            <option value="all">All Academic Groups</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Student Info</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4 text-right">Total Fee</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Latest Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment records matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const student = p.student;
                  const group = p.group || student?.group;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={student?.full_name || 'Student'}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{student?.full_name || 'Enrolled Student'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{student?.student_reg_no || 'REG-PENDING'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {group ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                            {group.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Group</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrencyIndian(p.total_fee)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrencyIndian(p.paid_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold font-mono">
                        <span className={p.balance_amount > 0 ? 'text-amber-600' : 'text-slate-400'}>
                          {formatCurrencyIndian(p.balance_amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {p.status === 'paid' ? 'Paid in Full' : p.status === 'partial' ? 'Partially Paid' : 'Unpaid'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.receipt_no ? (
                          <div>
                            <span className="font-mono text-slate-800 font-semibold block">{p.receipt_no}</span>
                            <span className="text-[11px] text-slate-400 uppercase">{p.payment_mode || 'UPI'} • {p.last_payment_date ? formatDateIndian(p.last_payment_date) : ''}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingHistoryPayment(p)}
                            title="View Receipt & Transaction History"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {currentUser.role === 'admin' && p.balance_amount > 0 && (
                            <button
                              onClick={() => handleOpenRecordModal(p.student_id)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px] transition-colors"
                            >
                              Pay Due
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Student Fee Payment"
        subtitle="Issue official receipt and update student balance"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentForPayment}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => {
                const pay = payments.find(p => p.student_id === s.id);
                const dueText = pay ? `(Balance: ₹${pay.balance_amount})` : '(New Ledger)';
                return (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_reg_no}) {dueText}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Course / Project Fee (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalFeeInput}
                onChange={(e) => setTotalFeeInput(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Being Paid Now (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="cash">Cash Counter Receipt</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="cheque">Cheque / Demand Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Number *
              </label>
              <input
                type="text"
                required
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                placeholder="REC-XXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks & Accounting Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. First installment paid via GPay transaction ID 4920..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction History & Receipt View Modal */}
      {viewingHistoryPayment && (
        <Modal
          isOpen={true}
          onClose={() => setViewingHistoryPayment(null)}
          title={`Fee Statement: ${viewingHistoryPayment.student?.full_name}`}
          subtitle={`Student ID: ${viewingHistoryPayment.student?.student_reg_no || 'N/A'} | Status: ${viewingHistoryPayment.status.toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Fee</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {formatCurrencyIndian(viewingHistoryPayment.total_fee)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-600 block uppercase font-medium">Total Paid</span>
                <span className="text-base font-bold text-emerald-600 font-mono">
                  {formatCurrencyIndian(viewingHistoryPayment.paid_amount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-amber-600 block uppercase font-medium">Balance Remaining</span>
                <span className="text-base font-bold text-amber-600 font-mono">
                  {formatCurrencyIndian(viewingHistoryPayment.balance_amount)}
                </span>
              </div>
            </div>

            {/* Transactions Log */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Transaction History
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {(viewingHistoryPayment.transactions && viewingHistoryPayment.transactions.length > 0) ? (
                  viewingHistoryPayment.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{tx.receipt_no}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                            {tx.payment_mode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDateIndian(tx.date)} {tx.notes ? `• ${tx.notes}` : ''}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-emerald-600 text-sm">
                        +{formatCurrencyIndian(tx.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{viewingHistoryPayment.receipt_no || 'REC-INITIAL'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                          {viewingHistoryPayment.payment_mode || 'UPI'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {viewingHistoryPayment.last_payment_date ? formatDateIndian(viewingHistoryPayment.last_payment_date) : 'Recent Payment'} {viewingHistoryPayment.remarks ? `• ${viewingHistoryPayment.remarks}` : ''}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-emerald-600 text-sm">
                      +{formatCurrencyIndian(viewingHistoryPayment.paid_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingHistoryPayment(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
