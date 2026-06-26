'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CampaignStatusBadge from './CampaignStatusBadge';

function StatItem({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{(value ?? 0).toLocaleString('ar-EG')}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

const groupLabels = {
  COMPLIANT:   'منتظمون',
  LATE:        'متأخرون',
  DEFAULTED:   'متعثرون',
  TRANSFERRED: 'محولون',
};

const EDITABLE_STATUSES  = ['draft', 'scheduled'];
const DELETABLE_STATUSES = ['draft', 'scheduled', 'completed', 'failed'];

export default function CampaignCard({ campaign, onTrigger, onEdit, onDelete }) {
  const [triggering, setTriggering] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const progress    = campaign._progress;
  const isEditable  = EDITABLE_STATUSES.includes(campaign.status);
  const isDeletable = DELETABLE_STATUSES.includes(campaign.status);

  const pct = progress?.total > 0
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  const handleTrigger = async () => {
    setTriggering(true);
    try { await onTrigger(campaign.id); }
    finally { setTriggering(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف الحملة "${campaign.title}"؟`)) return;
    setDeleting(true);
    try { await onDelete(campaign.id); }
    finally { setDeleting(false); }
  };

  return (
    <Card>
      {/* رأس الكارت */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-800">{campaign.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {groupLabels[campaign.targetCustomerGroup] || campaign.targetCustomerGroup}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <CampaignStatusBadge status={campaign.status} />

          {/* قلم التعديل — يظهر فقط للـ draft/scheduled */}
          {isEditable && (
            <button
              onClick={() => onEdit(campaign)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
              title="تعديل الحملة"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
              </svg>
            </button>
          )}

          {/* سلة الحذف */}
          {isDeletable && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
              title="حذف الحملة"
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
          )}
        </div>
      </div>

      {campaign.template && (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          القالب: {campaign.template.name}
        </p>
      )}

      {/* إحصائيات الرسائل */}
      <div className="mb-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3">
        <StatItem label="الإجمالي" value={campaign.stats?.total} />
        <StatItem label="أُرسل"    value={campaign.stats?.sent}      color="text-blue-600"  />
        <StatItem label="وُصّل"    value={campaign.stats?.delivered}  color="text-green-600" />
        <StatItem label="فشل"      value={campaign.stats?.failed}     color="text-red-600"   />
      </div>

      {/* شريط التقدم اللحظي */}
      {campaign.status === 'running' && progress && (
        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <div className="mb-1.5 flex justify-between text-xs text-blue-700">
            <span>جارٍ الإرسال...</span>
            <span>
              {progress.processed?.toLocaleString('ar-EG')} / {progress.total?.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* زر التشغيل — فقط للـ draft */}
      {campaign.status === 'draft' && (
        <div className="border-t border-slate-100 pt-3">
          <Button
            className="w-full"
            onClick={handleTrigger}
            loading={triggering}
            variant="success"
            size="sm"
          >
            تشغيل الحملة
          </Button>
        </div>
      )}
    </Card>
  );
}
