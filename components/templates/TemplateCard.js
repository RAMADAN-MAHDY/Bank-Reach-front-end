'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

function extractVariables(body) {
  const matches = body.match(/{{(\w+)}}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function TemplateCard({ template, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const variables = template.variables || extractVariables(template.body);

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${template.name}"؟`)) return;
    setDeleting(true);
    try { await onDelete(template.id); }
    finally { setDeleting(false); }
  };

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 leading-snug truncate">{template.name}</h3>
          {template.createdAt && (
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(template.createdAt)}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* قلم التعديل */}
          <button
            onClick={() => onEdit(template)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="تعديل القالب"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
            </svg>
          </button>

          {/* سلة الحذف */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
            title="حذف القالب"
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
      </div>

      <p className="mb-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700">
        {template.body}
      </p>

      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {variables.map((v) => (
            <Badge key={v} variant="blue">{`{{${v}}}`}</Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
