'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/use-customers';
import Header from '@/components/layout/Header';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerForm from '@/components/customers/CustomerForm';
import ImportExcelModal from '@/components/customers/ImportExcelModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';

const GROUP_OPTIONS = [
  { value: '', label: 'جميع المجموعات' },
  { value: 'COMPLIANT', label: 'المنتظمون' },
  { value: 'LATE', label: 'المتأخرون' },
  { value: 'DEFAULTED', label: 'المتعثرون' },
  { value: 'TRANSFERRED', label: 'المحولون' },
];

export default function CustomersPage() {
  const {
    customers, pagination, loading, error,
    params, updateParams,
    createCustomer, updateCustomer, deleteCustomer, importExcel,
  } = useCustomers();

  const [showAddModal, setShowAddModal]       = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [actionError, setActionError]         = useState(null);
  const [search, setSearch]                   = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search, page: 1 });
  };

  const handleGroupFilter = (e) => {
    updateParams({ customerGroup: e.target.value || undefined, page: 1 });
  };

  const handleCreate = async (data) => {
    await createCustomer(data);
    setShowAddModal(false);
  };

  const handleEdit = async (data) => {
    setActionError(null);
    try {
      await updateCustomer(editingCustomer.id, data);
      setEditingCustomer(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في تعديل بيانات العميل');
    }
  };

  const handleDelete = async (id) => {
    setActionError(null);
    try {
      await deleteCustomer(id);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في حذف العميل');
    }
  };

  const handleImport = async (file) => {
    return await importExcel(file);
  };

  return (
    <div className="space-y-5">
      <Header
        title="العملاء"
        subtitle={pagination ? `${pagination.totalDocs?.toLocaleString('ar-EG')} عميل` : 'إدارة بيانات العملاء'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              رفع Excel
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              + إضافة عميل
            </Button>
          </>
        }
      />

      <Alert variant="error" message={error || actionError} />

      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            placeholder="البحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">بحث</Button>
        </form>
        <Select
          options={GROUP_OPTIONS}
          value={params.customerGroup || ''}
          onChange={handleGroupFilter}
          className="w-48"
        />
      </div>

      <CustomerTable
        customers={customers}
        pagination={pagination}
        loading={loading}
        onPageChange={(page) => updateParams({ page })}
        onEdit={setEditingCustomer}
        onDelete={handleDelete}
      />

      {/* مودال الإضافة */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة عميل جديد" size="lg">
        <CustomerForm onSubmit={handleCreate} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* مودال التعديل */}
      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="تعديل بيانات العميل" size="lg">
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={handleEdit}
          onCancel={() => setEditingCustomer(null)}
        />
      </Modal>

      {/* مودال الاستيراد */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="استيراد عملاء من Excel">
        <ImportExcelModal onImport={handleImport} onCancel={() => setShowImportModal(false)} />
      </Modal>
    </div>
  );
}
