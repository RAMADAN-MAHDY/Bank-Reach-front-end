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
  const { templates, loading, error, createTemplate, deleteTemplate } = useTemplates();
  const [showModal, setShowModal] = useState(false);

  const handleCreate = async (data) => {
    await createTemplate(data);
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <Header
        title="قوالب الرسائل"
        subtitle={`${templates.length.toLocaleString('ar-EG')} قالب متاح`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            + قالب جديد
          </Button>
        }
      />

      <Alert variant="error" message={error} />

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
          <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>
            + إنشاء قالب
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={deleteTemplate}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إنشاء قالب جديد" size="lg">
        <TemplateForm onSubmit={handleCreate} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
