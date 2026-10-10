import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ListenButton from '../../components/ListenButton'
import { LANGS } from '../../lib/langs'
import { useApp } from '../../store/app'

/** Screen 1 (plan 3.9): language in native script, then a spoken privacy promise and consent. */
export default function WelcomePage() {
  const { t } = useTranslation()
  const { lang, langChosen, setLang, setConsented } = useApp()

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="" className="size-12" />
        <div>
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="text-slate-600">{t('app.tagline')}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('onboarding.chooseLanguage')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={langChosen && lang === l.code}
              className={`rounded-2xl border-2 px-4 py-5 text-2xl font-semibold ${
                langChosen && lang === l.code ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white'
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </section>

      {langChosen && (
        <section className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-6 text-green-700" aria-hidden />
            {t('onboarding.privacyTitle')}
          </h2>
          <p className="mb-4">{t('onboarding.privacyPromise')}</p>
          <div className="flex flex-wrap gap-3">
            <ListenButton text={t('onboarding.privacyPromise')} />
            <button
              type="button"
              onClick={() => setConsented(true)}
              className="rounded-full bg-brand px-6 py-2 font-semibold text-white"
            >
              {t('onboarding.agree')}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
