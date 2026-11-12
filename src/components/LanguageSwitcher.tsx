import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Language } from '@/lib/translations';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 bg-ocean-900/80 backdrop-blur-md border border-cyanNeon/40 hover:border-cyanNeon rounded-xl pl-3 pr-1 py-1 text-xs text-cyan-100 shadow-lg transition-all focus-within:border-cyanNeon">
      <Globe className="w-4 h-4 text-cyanNeon" aria-hidden />
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer py-1 pr-1 [&>option]:bg-ocean-900"
      >
        <option value="pt">Português</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
