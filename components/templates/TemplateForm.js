'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { ModalFooter } from '@/components/ui/Modal';

const AVAILABLE_VARIABLES = ['fullName', 'overdueDays', 'guarantorName', 'guarantorPhone', 'phoneNumber', 'dueDate'];

export default function TemplateForm({ onSubmit, onCancel, initialData = null }) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    body: initialData?.body ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const insertVariable = (variable) => {
    setForm((prev) => ({ ...prev, body: prev.body + `{{${variable}}}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ القالب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />

      <Input
        label="اسم القالب"
        id="name"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="رسالة المتأخرين - شهر 6"
        required
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            نص الرسالة <span className="mr-1 text-red-500">*</span>
          </label>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {AVAILABLE_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              {`{{${v}}}`}
            </button>
          ))}
        </div>
        <Textarea
          id="body"
          name="body"
          value={form.body}
          onChange={handleChange}
          placeholder="عزيزي {{fullName}}، نذكرك بأن قسطك متأخر لمدة {{overdueDays}} يوم."
          rows={5}
        />
        <p className="mt-1 text-xs text-slate-400">انقر على المتغير لإدراجه في نص الرسالة</p>
      </div>

      <ModalFooter>
        <Button variant="secondary" type="button" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'حفظ التعديلات' : 'حفظ القالب'}
        </Button>
      </ModalFooter>
    </form>
  );
}
