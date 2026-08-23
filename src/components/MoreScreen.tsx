import { t } from '../utils/i18n';
import { ArrowLeft, Settings, Shield, FileText, HelpCircle } from 'lucide-react';

export default function MoreScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: string) => void }) {
  const items = [
    { id: 'settings', title: t('settings'), icon: Settings, desc: t('language') + ', ' + t('theme') + ', ' + t('security') },
    { id: 'privacy', title: t('privacy'), icon: Shield, desc: t('dataLocal') },
    { id: 'report', title: t('report'), icon: FileText, desc: t('reportGenerated') },
    { id: 'help', title: t('help'), icon: HelpCircle, desc: t('about') },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('more')}</h1>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
            <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center shrink-0">
              <item.icon className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-navy-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
            <ArrowLeft className="text-gray-400 rotate-180" size={18} />
          </button>
        ))}
      </div>

      <div className="bg-navy-900 rounded-2xl p-5 text-white text-center">
        <p className="text-sm font-medium mb-1">{t('appName')}</p>
        <p className="text-white/50 text-xs">{t('copyright')}</p>
        <p className="text-white/50 text-xs mt-1">{t('madeInIndia')}</p>
      </div>
    </div>
  );
}
