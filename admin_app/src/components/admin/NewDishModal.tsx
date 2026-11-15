import React, { useState } from 'react'
import { Button, Field, Modal, SelectInput, TextArea, TextInput } from '../ui/primitives'

export interface NewDishValues {
  name: string
  price: string
  category: string
  description: string
  imageUrl: string
}

interface NewDishModalProps {
  categories: string[]
  photos: { url: string; label: string }[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: NewDishValues) => void
  /** Option propre à la page (promotion, plat du jour), posée sous le formulaire. */
  children?: React.ReactNode
}

export const NewDishModal: React.FC<NewDishModalProps> = ({
  categories,
  photos,
  isSubmitting,
  onClose,
  onSubmit,
  children,
}) => {
  const [values, setValues] = useState<NewDishValues>({
    name: '',
    price: '3500',
    category: categories[0],
    description: '',
    imageUrl: photos[0].url,
  })

  const set = (key: keyof NewDishValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  return (
    <Modal
      title="Ajouter un plat"
      description="Il rejoindra la carte du site client."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="new-dish-form" variant="primary" isLoading={isSubmitting}>
            Enregistrer le plat
          </Button>
        </>
      }
    >
      <form
        id="new-dish-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(values)
        }}
      >
        <Field label="Nom du plat" htmlFor="dish-name">
          <TextInput
            id="dish-name"
            required
            autoFocus
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Tacos suprême fromager"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (F CFA)" htmlFor="dish-price">
            <TextInput
              id="dish-price"
              type="number"
              required
              min={500}
              step={100}
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </Field>
          <Field label="Catégorie" htmlFor="dish-category">
            <SelectInput
              id="dish-category"
              value={values.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Description" htmlFor="dish-description">
          <TextArea
            id="dish-description"
            rows={2}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ingrédients, recette…"
          />
        </Field>

        <Field label="Photo" htmlFor="dish-photo">
          <SelectInput
            id="dish-photo"
            value={values.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
          >
            {photos.map((photo) => (
              <option key={photo.url} value={photo.url}>
                {photo.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        {children}
      </form>
    </Modal>
  )
}
