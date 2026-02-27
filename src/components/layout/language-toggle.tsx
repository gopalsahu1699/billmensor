'use client'

import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
    const { i18n, t } = useTranslation()

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'hi' : 'en'
        i18n.changeLanguage(newLang)
    }

    return (
        <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent hover:border-white/20 text-slate-300 hover:bg-white/5 hover:text-white"
        >
            <div className="flex items-center gap-3">
                <div className="shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
                    {i18n.language === 'en' ? 'EN' : 'HI'}
                </div>
                <span>{i18n.language === 'en' ? 'English' : 'हिंदी'}</span>
            </div>
        </button>
    )
}
