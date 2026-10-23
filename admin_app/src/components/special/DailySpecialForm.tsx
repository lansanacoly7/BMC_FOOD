import React, { useState } from 'react'
import {
  UtensilsCrossed,
  Save,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

import { formatFcfa } from '../../lib/formatters'

interface DailySpecialFormProps {
  onSuccess?: () => void
}

export const DailySpecialForm: React.FC<DailySpecialFormProps> = ({ onSuccess }) => {
  const [dishName, setDishName] = useState('Tiep Bou Dienn Penda Mbaye Royal')
  const [price, setPrice] = useState('4500')
  const [quantity, setQuantity] = useState('25')
  const [description, setDescription] = useState(
    'Riz rouge sénégalais parfumé au poisson frais (mérou blanc), légumes du jour mijotés et beignets d’oignons.',
  )
  const [isAvailable, setIsAvailable] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)

    // Simulation de sauvegarde locale ou API
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      onSuccess?.()
    }, 400)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div
        className="p-6 rounded-2xl border shadow-lg"
        style={{
          backgroundColor: 'var(--kds-bg-surface)',
          borderColor: 'var(--kds-border-default)',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--kds-border-default)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(252, 184, 0, 0.15)', color: 'var(--kds-gold)' }}
            >
              <UtensilsCrossed size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--kds-text-primary)' }}>
                Configuration du Plat du Jour
              </h2>
              <p className="text-xs font-semibold" style={{ color: 'var(--kds-text-muted)' }}>
                Mis en avant instantanément sur le site client et le menu du jour
              </p>
            </div>
          </div>

          {/* Toggle Épuisé / Disponible */}
          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-black transition-all"
            style={{
              backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isAvailable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              color: isAvailable ? '#6EE7B7' : '#FCA5A5',
            }}
          >
            {isAvailable ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} className="text-red-400" />}
            <span>{isAvailable ? 'Disponible à la vente' : 'Épuisé (Rupture)'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nom du plat */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kds-text-secondary)' }}>
              Nom du plat du jour
            </label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              required
              className="px-4 py-3 rounded-xl border text-base font-bold focus:outline-none"
              style={{
                backgroundColor: 'var(--kds-bg-app)',
                borderColor: 'var(--kds-border-default)',
                color: 'var(--kds-text-primary)',
              }}
              placeholder="Ex : Tiep Bou Dienn Penda Mbaye…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prix en F CFA */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kds-text-secondary)' }}>
                Prix de vente (F CFA)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="500"
                step="100"
                className="px-4 py-3 rounded-xl border text-base font-bold font-tabular focus:outline-none"
                style={{
                  backgroundColor: 'var(--kds-bg-app)',
                  borderColor: 'var(--kds-border-default)',
                  color: 'var(--kds-text-primary)',
                }}
                placeholder="4500"
              />
              <span className="text-xs font-semibold text-slate-400">
                Aperçu client : {formatFcfa(Number(price) || 0)}
              </span>
            </div>

            {/* Quantité disponible */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kds-text-secondary)' }}>
                Quantité préparée (Portions)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                className="px-4 py-3 rounded-xl border text-base font-bold font-tabular focus:outline-none"
                style={{
                  backgroundColor: 'var(--kds-bg-app)',
                  borderColor: 'var(--kds-border-default)',
                  color: 'var(--kds-text-primary)',
                }}
                placeholder="25"
              />
            </div>
          </div>

          {/* Description / Ingrédients */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kds-text-secondary)' }}>
              Description & Garnitures
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--kds-bg-app)',
                borderColor: 'var(--kds-border-default)',
                color: 'var(--kds-text-primary)',
              }}
            />
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--kds-border-default)' }}>
            <div>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span>Plat du jour enregistré et publié !</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 shadow-lg select-none"
              style={{
                backgroundColor: 'var(--kds-gold)',
                color: '#080B10',
              }}
            >
              <Save size={18} strokeWidth={2.8} />
              <span>{isSaving ? 'Enregistrement…' : 'Enregistrer le Plat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
