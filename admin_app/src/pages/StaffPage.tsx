import React, { useEffect, useState } from 'react'
import { Check, AlertCircle, Trash2, UserPlus, Users, X } from 'lucide-react'
import { createStaff, deleteStaff, fetchStaff } from '../services/api'

interface StaffMember {
  id: number
  username: string
  role: string
  email: string
  is_active: boolean
  is_superuser: boolean
  date_joined: string
}

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal création
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Cuisine / KDS')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const loadStaff = async () => {
    setIsLoading(true)
    try {
      const res = await fetchStaff()
      if (res && res.success && Array.isArray(res.staff)) {
        setStaffList(res.staff)
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStaff()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createStaff({
        username: username.trim(),
        password: password.trim(),
        role: role.trim(),
      })
      if (res && res.success) {
        showNotification(`Compte employé « ${username} » créé avec succès !`)
        setIsModalOpen(false)
        setUsername('')
        setPassword('')
        void loadStaff()
      } else {
        showNotification("Impossible de créer l'employé", 'error')
      }
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : "Erreur lors de la création de l'employé",
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (member: StaffMember) => {
    if (!window.confirm(`Supprimer le compte employé « ${member.username} » ?`)) return
    try {
      const res = await deleteStaff(member.id)
      if (res && res.success) {
        showNotification(`Compte « ${member.username} » supprimé.`)
        setStaffList((prev) => prev.filter((m) => m.id !== member.id))
      }
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : 'Erreur lors de la suppression',
        'error',
      )
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 text-left overflow-y-auto">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 rounded-xl px-4 py-2.5 border text-xs font-semibold flex items-center gap-2 shadow-xl ${
            notification.type === 'success'
              ? 'bg-[#14171C] border-emerald-500/40 text-emerald-300'
              : 'bg-[#14171C] border-red-500/40 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <AlertCircle className="size-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Comptes Employés & Équipe</h2>
          <p className="text-xs text-[#8A93A0]">
            Créez des accès sécurisés pour les équipes en Cuisine, Caisse et Salle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F5B301] hover:bg-[#ffc32b] px-3.5 py-2 text-xs font-semibold text-black cursor-pointer transition-colors"
        >
          <UserPlus className="size-4" />
          <span>Nouvel employé</span>
        </button>
      </div>

      <div className="border border-[#1F242B] rounded-xl overflow-hidden bg-[#0F1216]">
        {staffList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Users className="mx-auto size-8 text-[#5F6875]" />
            <p className="text-sm font-medium text-[#C4CAD3]">
              {isLoading ? 'Chargement des comptes...' : 'Aucun employé enregistré'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#5F6875] border-b border-[#1F242B] bg-[#12151A]">
                <th className="py-3 px-4 font-normal">Identifiant</th>
                <th className="py-3 px-4 font-normal">Rôle / Poste</th>
                <th className="py-3 px-4 font-normal">Date de création</th>
                <th className="py-3 px-4 font-normal">Statut</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id} className="border-b border-[#16191E] hover:bg-[#15191F] transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{member.username}</td>
                  <td className="py-3 px-4">
                    <span className="rounded px-2 py-0.5 text-xs bg-[#1A1E24] text-[#C4CAD3] border border-[#2A313C]">
                      {member.role || 'Employé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#8A93A0]">
                    {new Date(member.date_joined).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
                      Actif
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!member.is_superuser && (
                      <button
                        type="button"
                        onClick={() => handleDelete(member)}
                        className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL : Créer un compte employé */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A313C] bg-[#12151A] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#1F242B] pb-3">
              <h3 className="text-base font-semibold text-white">Créer un compte employé</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A93A0] hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                  Identifiant de connexion *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: moussa_kds"
                  className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white placeholder-[#5F6875] focus:border-[#F5B301] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 4 caractères"
                  className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white placeholder-[#5F6875] focus:border-[#F5B301] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C4CAD3] mb-1">
                  Rôle / Affectation
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-[#2A313C] bg-[#0F1216] px-3 py-2 text-xs text-white focus:border-[#F5B301] focus:outline-none"
                >
                  <option value="Cuisine / KDS">Cuisine / KDS</option>
                  <option value="Caisse / Vente">Caisse / Vente</option>
                  <option value="Service / Salle">Service / Salle</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#1F242B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg bg-[#1A1E24] py-2 text-xs font-medium text-[#C4CAD3] hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-[#F5B301] hover:bg-[#ffc32b] py-2 text-xs font-semibold text-black cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
