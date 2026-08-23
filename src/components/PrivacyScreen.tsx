import { t } from '../utils/i18n';
import { ArrowLeft, Shield, Lock, Eye, Server, WifiOff, Fingerprint } from 'lucide-react';

export default function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const features = [
    { icon: Shield, title: t('localFirst'), desc: t('dataLocal') },
    { icon: Lock, title: t('encryptedStorage'), desc: t('encryptionStandard') },
    { icon: Eye, title: t('noTracking'), desc: t('noThirdParty') },
    { icon: Server, title: t('noCloudStorage'), desc: t('noExternalAPIs') },
    { icon: WifiOff, title: t('offlineReady'), desc: t('offlineReady') },
    { icon: Fingerprint, title: t('biometricUnlock'), desc: t('secureByDesign') },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-navy-900">{t('privacy')}</h1>
      </div>

      <div className="bg-navy-900 rounded-2xl p-6 text-white text-center">
        <Shield className="mx-auto mb-3 text-amber-400" size={40} />
        <h2 className="text-xl font-bold mb-2">{t('privacyNotice')}</h2>
        <p className="text-white/70 text-sm">{t('yourDataStays')}</p>
      </div>

      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <f.icon className="text-blue-700" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-sm">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">{t('disclaimer')}</p>
        <p className="text-xs text-amber-700">{t('sebiDisclaimer')}</p>
      </div>
    </div>
  );
}
