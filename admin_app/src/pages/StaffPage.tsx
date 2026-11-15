import React, { useEffect, useState } from 'react'
import { Trash2, UserPlus, Users } from 'lucide-react'
import { createStaff, deleteStaff, fetchStaff } from '../services/api'
import {
  Badge,
  Button,
  Card,
  EmptyBlock,
  Field,
  IconButton,
  Modal,
  Notice,
  PageBody,
  SelectInput,
  Table,
  Td,
  TextInput,
  Th,
  Toolbar,
  Tr,
  type NoticeState,
} from '../components/ui/primitives'

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
  const [notification, setNotification] = useState<NoticeState | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null)

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
    setMemberToDelete(null)
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
    <PageBody>
      <Notice notice={notification} />

      <Card className="overflow-hidden">
        <Toolbar>
          <p className="font-display text-base font-semibold">
            {staffList.length} {staffList.length > 1 ? 'comptes' : 'compte'}
          </p>
          <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)} className="ml-auto">
            Ajouter un employé
          </Button>
        </Toolbar>

        {staffList.length === 0 ? (
          <EmptyBlock
            icon={Users}
            title={isLoading ? 'Chargement des comptes…' : 'Aucun employé enregistré'}
            description={isLoading ? undefined : 'Créez un accès pour chaque membre de l’équipe.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Employé</Th>
                  <Th>Rôle</Th>
                  <Th className="hidden md:table-cell">Créé le</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <Tr key={member.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-raised font-display text-sm font-bold uppercase text-ink-soft"
                        >
                          {member.username.charAt(0)}
                        </span>
                        <span className="font-semibold">{member.username}</span>
                      </div>
                    </Td>
                    <Td className="text-ink-soft">{member.role || 'Employé'}</Td>
                    <Td className="hidden tabular-nums text-ink-soft md:table-cell">
                      {new Date(member.date_joined).toLocaleDateString('fr-FR')}
                    </Td>
                    <Td>
                      <Badge tone={member.is_active ? 'ok' : 'neutral'}>
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {!member.is_superuser && (
                        <IconButton
                          icon={Trash2}
                          label={`Supprimer ${member.username}`}
                          onClick={() => setMemberToDelete(member)}
                          className="hover:!bg-bad-soft hover:!text-bad"
                        />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <Modal
          title="Ajouter un employé"
          description="Son identifiant lui servira à se connecter."
          onClose={() => setIsModalOpen(false)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" form="staff-form" variant="primary" isLoading={isSubmitting}>
                Créer le compte
              </Button>
            </>
          }
        >
          <form id="staff-form" onSubmit={handleCreate} className="space-y-4">
            <Field label="Identifiant de connexion" htmlFor="staff-username">
              <TextInput
                id="staff-username"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="moussa_kds"
              />
            </Field>
            <Field label="Mot de passe" htmlFor="staff-password">
              <TextInput
                id="staff-password"
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="4 caractères minimum"
              />
            </Field>
            <Field label="Rôle" htmlFor="staff-role">
              <SelectInput id="staff-role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Cuisine / KDS">Cuisine / KDS</option>
                <option value="Caisse / Vente">Caisse / Vente</option>
                <option value="Service / Salle">Service / Salle</option>
                <option value="Manager">Manager</option>
              </SelectInput>
            </Field>
          </form>
        </Modal>
      )}

      {memberToDelete && (
        <Modal
          title="Supprimer ce compte ?"
          description={`${memberToDelete.username} ne pourra plus se connecter.`}
          onClose={() => setMemberToDelete(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setMemberToDelete(null)}>
                Annuler
              </Button>
              <Button variant="primary" icon={Trash2} onClick={() => void handleDelete(memberToDelete)}>
                Supprimer le compte
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-soft">Cette action est définitive.</p>
        </Modal>
      )}
    </PageBody>
  )
}
