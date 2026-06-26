'use client';

import { useState } from 'react';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useTemplates } from '@/hooks/use-templates';
import { useCampaignSocket } from '@/hooks/use-campaign-socket';
import Header from '@/components/layout/Header';
import CampaignCard from '@/components/campaigns/CampaignCard';
import CampaignForm from '@/components/campaigns/CampaignForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function CampaignsPage() {
  const {
    campaigns, loading, error,
    createCampaign, updateCampaign, deleteCampaign, triggerCampaign,
    applySocketUpdate,
  } = useCampaigns();
  const { templates } = useTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign]  = useState(null);
  const [actionError, setActionError]          = useState(null);

  // تحديثات WebSocket اللحظية
  useCampaignSocket({ onUpdate: applySocketUpdate });

  const handleCreate = async (data) => {
    await createCampaign(data);
    setShowCreateModal(false);
  };

  const handleEdit = async (data) => {
    setActionError(null);
    try {
      await updateCampaign(editingCampaign.id, data);
      setEditingCampaign(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في تعديل الحملة');
    }
  };

  const handleDelete = async (id) => {
    setActionError(null);
    try {
      await deleteCampaign(id);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في حذف الحملة');
    }
  };

  const handleTrigger = async (id) => {
    setActionError(null);
    try {
      await triggerCampaign(id);
    } catch (err) {
      setActionError(err.response?.data?.message || 'فشل في تشغيل الحملة');
    }
  };

  return (
    <div className="space-y-5">
      <Header
        title="الحملات"
        subtitle={`${campaigns.length.toLocaleString('ar-EG')} حملة`}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            + حملة جديدة
          </Button>
        }
      />

      <Alert variant="error" message={error || actionError} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <svg className="mb-3 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">لا توجد حملات بعد</p>
          <p className="text-xs text-slate-400 mt-1">أنشئ حملتك الأولى لبدء التواصل مع العملاء</p>
          <Button className="mt-4" size="sm" onClick={() => setShowCreateModal(true)}>
            + إنشاء حملة
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onTrigger={handleTrigger}
              onEdit={setEditingCampaign}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* مودال الإنشاء */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="إنشاء حملة جديدة"
        size="lg"
      >
        <CampaignForm
          templates={templates}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* مودال التعديل */}
      <Modal
        isOpen={!!editingCampaign}
        onClose={() => setEditingCampaign(null)}
        title="تعديل الحملة"
        size="lg"
      >
        <CampaignForm
          templates={templates}
          initialData={editingCampaign}
          onSubmit={handleEdit}
          onCancel={() => setEditingCampaign(null)}
        />
      </Modal>
    </div>
  );
}
