'use client';

import { useState } from 'react';
import { useTemplates } from '@/hooks/use-templates';
import Header from '@/components/layout/Header';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateForm from '@/components/templates/TemplateForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function TemplatesPage() {
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [actionError, setActionError]         = useState(null);

  const handleCreate = async (data) => {
    await createTemplate(data);
    setShowCreateModal(false);
  };

  const handleEdit = async (data) => {
    setActionError(null);
    try {
      await updateTemplate(editingTemplate.id, data);
      setEditingTemplate(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في تعديل القالب');
    }
  };

  return (
    <div className="space-y-5">
      <Header
        title="قوالب الرسائل"
        subtitle={`${templates.length.toLocaleString('ar-EG')} قالب متاح`}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>+ قالب جديد</Button>
        }
      />

      <Alert variant="error" message={error || actionError} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">لا توجد قوالب بعد</p>
          <p className="text-xs text-slate-400 mt-1">أنشئ أول قالب رسالة لبدء إرسال الحملات</p>
          <Button className="mt-4" size="sm" onClick={() => setShowCreateModal(true)}>+ إنشاء قالب</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onDelete={deleteTemplate}
            />
          ))}
        </div>
      )}

      {/* مودال الإنشاء */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء قالب جديد" size="lg">
        <TemplateForm onSubmit={handleCreate} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* مودال التعديل */}
      <Modal isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} title="تعديل القالب" size="lg">
        <TemplateForm
          initialData={editingTemplate}
          onSubmit={handleEdit}
          onCancel={() => setEditingTemplate(null)}
        />
      </Modal>
    </div>
  );
}
