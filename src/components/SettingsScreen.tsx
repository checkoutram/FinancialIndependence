import { useState } from 'react';
import { useApp } from '../utils/store';
import { t, LANGUAGES } from '../utils/i18n';
import { ArrowLeft, Globe, Lock, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { data, setLanguage, deleteAllData, exportBackup } = useApp();
  const [showDelete, setShowDelete] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [pin, setPin] = useState('');

  const handleExport = async () => {
    try {
      const backup = await exportBackup(pin);
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finplan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setShowBackup(false);
      setPin('');
    } catch (e) {
      alert(t('error'));
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('settings')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Globe size={20} className="text-gray-500" />
          <div className="flex-1">
            <p className="font-medium text-navy-900">{t('language')}</p>
          </div>
          <select
            value={data?.settings.language || 'en'}
            onChange={e => setLanguage(e.target.value as any)}
            className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-navy-900"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
          </select>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Lock size={20} className="text-gray-500" />
          <div className="flex-1">
            <p className="font-medium text-navy-900">{t('changePIN')}</p>
          </div>
          <button onClick={() => alert('Change PIN - Coming Soon')} className="text-sm text-navy-900 font-medium bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">{t('change')}</button>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Download size={20} className="text-gray-500" />
          <div className="flex-1">
            <p className="font-medium text-navy-900">{t('exportBackup')}</p>
          </div>
          <button onClick={() => setShowBackup(true)} className="text-sm text-navy-900 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">{t('export')}</button>
        </div>

        <div className="p-4 flex items-center gap-3">
          <Upload size={20} className="text-gray-500" />
          <div className="flex-1">
            <p className="font-medium text-navy-900">{t('restoreBackup')}</p>
          </div>
          <button onClick={() => alert('Restore Backup - Coming Soon')} className="text-sm text-navy-900 font-medium bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">{t('import')}</button>
        </div>
      </div>

      <button onClick={() => setShowDelete(true)} className="w-full bg-red-50 border border-red-100 text-red-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
        <Trash2 size={18} /> {t('deleteAllData')}
      </button>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg">{t('confirmDelete')}</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">{t('deleteWarning')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 bg-gray-200 text-navy-900 py-3 rounded-xl font-semibold">{t('cancel')}</button>
              <button onClick={() => { deleteAllData(); setShowDelete(false); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {showBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg text-navy-900 mb-4">{t('exportBackup')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('enterPIN')}</p>
            <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-center text-2xl tracking-widest" placeholder="______" />
            <div className="flex gap-3">
              <button onClick={() => setShowBackup(false)} className="flex-1 bg-gray-200 text-navy-900 py-3 rounded-xl font-semibold">{t('cancel')}</button>
              <button onClick={handleExport} disabled={pin.length !== 6} className="flex-1 bg-navy-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{t('download')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
