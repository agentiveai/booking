'use client';

import { useState, useEffect } from 'react';

interface WorkflowAction {
  type: 'EMAIL' | 'SMS' | 'WEBHOOK';
  templateType?: 'confirmation' | 'reminder' | 'cancellation' | 'custom';
  recipientType: 'CUSTOMER' | 'PROVIDER' | 'STAFF' | 'CUSTOM';
  webhookUrl?: string;
}

interface Workflow {
  id: string;
  name: string;
  nameNo: string;
  trigger: string;
  actions: WorkflowAction[];
  isActive: boolean;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameNo: '',
    trigger: 'BOOKING_CREATED',
    actions: [] as WorkflowAction[],
    isActive: true,
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/workflows', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    const url = editing ? `/api/workflows/${editing.id}` : '/api/workflows';
    const method = editing ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadWorkflows();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Slett arbeidsflyt?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/workflows/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) loadWorkflows();
  };

  const toggleActive = async (w: Workflow) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/workflows/${w.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: !w.isActive }),
    });
    loadWorkflows();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameNo: '',
      trigger: 'BOOKING_CREATED',
      actions: [],
      isActive: true,
    });
  };

  const openEdit = (w: Workflow) => {
    setEditing(w);
    setFormData({
      name: w.name,
      nameNo: w.nameNo,
      trigger: w.trigger,
      actions: w.actions,
      isActive: w.isActive,
    });
    setShowModal(true);
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'EMAIL', templateType: 'confirmation', recipientType: 'CUSTOMER' }],
    });
  };

  const quickTemplate = (type: 'confirmation' | 'reminder' | 'cancellation') => {
    const templates = {
      confirmation: { name: 'Confirmation', nameNo: 'Bekreftelse', trigger: 'BOOKING_CREATED' },
      reminder: { name: 'Reminder', nameNo: '24-timers paminnelse', trigger: 'HOURS_BEFORE_24' },
      cancellation: { name: 'Cancellation', nameNo: 'Avbestilling', trigger: 'BOOKING_CANCELLED' },
    };
    setFormData({
      ...formData,
      ...templates[type],
      actions: [{ type: 'EMAIL', templateType: type, recipientType: 'CUSTOMER' }],
    });
    setShowModal(true);
  };

  if (loading) return <div className="p-8">Laster...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Automatisering</h1>
      <p className="text-gray-600 mb-8">Opprett automatiske e-poster basert på bookinger</p>

      <div className="mb-8 bg-blue-50 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Hurtigmaler</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => quickTemplate('confirmation')} className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 text-left">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold">Bekreftelse</div>
            <div className="text-sm text-gray-600">Send nar kunde booker</div>
          </button>
          <button onClick={() => quickTemplate('reminder')} className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 text-left">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-semibold">24-timers paminnelse</div>
            <div className="text-sm text-gray-600">Automatisk dagen før</div>
          </button>
          <button onClick={() => quickTemplate('cancellation')} className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 text-left">
            <div className="text-2xl mb-2">❌</div>
            <div className="font-semibold">Avbestilling</div>
            <div className="text-sm text-gray-600">Bekreft avbestilling</div>
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Arbeidsflyter</h2>
          <button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Ny
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Ingen arbeidsflyter enna</div>
        ) : (
          <div className="divide-y">
            {workflows.map(w => (
              <div key={w.id} className="p-6 hover:bg-gray-50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{w.nameNo}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${w.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {w.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{w.actions.length} handling(er)</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(w)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                    {w.isActive ? 'Deaktiver' : 'Aktiver'}
                  </button>
                  <button onClick={() => openEdit(w)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Rediger</button>
                  <button onClick={() => handleDelete(w.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Slett</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">{editing ? 'Rediger' : 'Ny'} arbeidsflyt</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Navn (Norsk)</label>
                <input type="text" value={formData.nameNo} onChange={e => setFormData({ ...formData, nameNo: e.target.value, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Trigger</label>
                <select value={formData.trigger} onChange={e => setFormData({ ...formData, trigger: e.target.value })} className="w-full px-3 py-2 border rounded">
                  <option value="BOOKING_CREATED">Nar booking opprettes</option>
                  <option value="BOOKING_CONFIRMED">Nar booking bekreftes</option>
                  <option value="BOOKING_CANCELLED">Nar booking avbestilles</option>
                  <option value="HOURS_BEFORE_24">24 timer før</option>
                  <option value="HOURS_BEFORE_48">48 timer før</option>
                  <option value="HOURS_BEFORE_1">1 time før</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Handlinger</label>
                  <button onClick={addAction} className="text-sm text-blue-600">+ Legg til</button>
                </div>
                {formData.actions.map((a, i) => (
                  <div key={i} className="border rounded p-3 mb-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Handling {i + 1}</span>
                      <button onClick={() => setFormData({ ...formData, actions: formData.actions.filter((_, idx) => idx !== i) })} className="text-red-600 text-sm">Fjern</button>
                    </div>
                    <select value={a.type} onChange={e => { const newActions = [...formData.actions]; newActions[i] = { ...newActions[i], type: e.target.value as any }; setFormData({ ...formData, actions: newActions }); }} className="w-full px-3 py-2 text-sm border rounded mb-2">
                      <option value="EMAIL">E-post</option>
                      <option value="WEBHOOK">Webhook</option>
                    </select>
                    {a.type === 'EMAIL' && (
                      <select value={a.templateType} onChange={e => { const newActions = [...formData.actions]; newActions[i] = { ...newActions[i], templateType: e.target.value as any }; setFormData({ ...formData, actions: newActions }); }} className="w-full px-3 py-2 text-sm border rounded">
                        <option value="confirmation">Bekreftelse</option>
                        <option value="reminder">Paminnelse</option>
                        <option value="cancellation">Avbestilling</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <label className="flex items-center">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="mr-2" />
                <span className="text-sm">Aktiv</span>
              </label>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setEditing(null); resetForm(); }} className="px-4 py-2 border rounded">Avbryt</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Lagre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
