'use client';

import { useState } from 'react';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import CustomerGroupBadge from './CustomerGroupBadge';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function RowActions({ customer, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.fullName}"؟`)) return;
    setDeleting(true);
    try { await onDelete(customer.id); }
    finally { setDeleting(false); }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => onEdit(customer)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
        title="تعديل"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
        title="حذف"
      >
        {deleting ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function CustomerTable({ customers, pagination, loading, onPageChange, onEdit, onDelete }) {
  const columns = [
    { key: 'fullName', title: 'الاسم الكامل' },
    { key: 'phoneNumber', title: 'رقم الهاتف' },
    { key: 'guarantorName', title: 'الضامن' },
    { key: 'guarantorPhone', title: 'هاتف الضامن' },
    { key: 'dueDate', title: 'تاريخ الاستحقاق', render: (val) => formatDate(val) },
    {
      key: 'overdueDays',
      title: 'أيام التأخير',
      render: (val) => (
        <span className={val > 0 ? 'font-semibold text-red-600' : 'text-slate-500'}>
          {(val ?? 0).toLocaleString('ar-EG')} يوم
        </span>
      ),
    },
    {
      key: 'customerGroup',
      title: 'المجموعة',
      render: (val) => <CustomerGroupBadge group={val} />,
    },
    {
      key: 'id',
      title: 'إجراءات',
      render: (_, row) => <RowActions customer={row} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  return (
    <div>
      <Table columns={columns} data={customers} loading={loading} emptyMessage="لا يوجد عملاء بهذه المعايير" />
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
