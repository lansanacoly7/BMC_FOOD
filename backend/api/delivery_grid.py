"""
Grille officielle des quartiers et frais de livraison BMC FOOD (V1).

Source de vérité : `client_website/src/lib/delivery.ts` et `docs/frais_livraison_bmc.md`
(grille fournie par Pape Aliou Sène le 21/10/2026).

- Les frais de livraison sont calculés exclusivement côté serveur.
- Pour la destination éloignée (`autre-destination-plus-eloignee`), `fee` vaut `None`
  (prix confirmé par téléphone) et `total_amount` reste égal à `subtotal`.
"""
import re
from .models import DeliveryArea

# Liste officielle des zones et quartiers : (zone, zone_label, [(slug, name, fee), ...])
DELIVERY_ZONES_DATA = [
    (1, 'Très proche', [
        ('cite-mixta', 'Cité Mixta', 1000),
        ('grand-yoff', 'Grand Yoff', 1000),
        ('patte-d-oie', 'Patte d’Oie', 1000),
        ('arafat', 'Arafat', 1000),
    ]),
    (2, 'Proche', [
        ('nord-foire', 'Nord Foire', 1500),
        ('foire', 'Foire', 1500),
        ('liberte-5', 'Liberté 5', 1500),
        ('liberte-6', 'Liberté 6', 1500),
        ('hlm', 'HLM', 1500),
        ('dieuppeul', 'Dieuppeul', 1500),
        ('cite-des-eaux', 'Cité des Eaux', 1500),
    ]),
    (3, 'Dakar nord', [
        ('parcelles-assainies', 'Parcelles Assainies', 1500),
        ('yoff', 'Yoff', 1500),
        ('ouest-foire', 'Ouest Foire', 1500),
        ('camberene', 'Cambérène', 2000),
        ('tivaouane-peulh', 'Tivaouane Peulh', 2000),
    ]),
    (4, 'Dakar centre', [
        ('sacre-c-ur', 'Sacré-Cœur', 2000),
        ('sicap', 'Sicap', 2000),
        ('castors', 'Castors', 2000),
        ('amitie', 'Amitié', 2000),
        ('fann', 'Fann', 2000),
        ('point-e', 'Point E', 2000),
        ('fass', 'Fass', 2000),
        ('medina', 'Médina', 2000),
    ]),
    (5, 'Dakar ouest', [
        ('mermoz', 'Mermoz', 2500),
        ('ouakam', 'Ouakam', 2500),
        ('ngor', 'Ngor', 2500),
        ('almadies', 'Almadies', 2500),
        ('mamelles', 'Mamelles', 2500),
        ('corniche-ouest', 'Corniche Ouest', 2500),
    ]),
    (6, 'Plateau et sud', [
        ('plateau', 'Plateau', 2500),
        ('colobane', 'Colobane', 2500),
        ('rebeuss', 'Rebeuss', 2500),
        ('gueule-tapee', 'Gueule Tapée', 2500),
        ('hann-maristes', 'Hann Maristes', 2500),
        ('hann-bel-air', 'Hann Bel-Air', 2500),
    ]),
    (7, 'Banlieue proche', [
        ('pikine', 'Pikine', 3000),
        ('dalifort', 'Dalifort', 3000),
        ('thiaroye', 'Thiaroye', 3000),
        ('guediawaye', 'Guédiawaye', 3000),
        ('golf-sud', 'Golf Sud', 3000),
        ('yeumbeul', 'Yeumbeul', 3000),
    ]),
    (8, 'Banlieue éloignée', [
        ('keur-massar', 'Keur Massar', 3000),
        ('malika', 'Malika', 3500),
        ('jaxaay', 'Jaxaay', 3500),
        ('rufisque', 'Rufisque', 3500),
        ('sangalkam', 'Sangalkam', 3500),
    ]),
    (9, 'Longue distance', [
        ('bargny', 'Bargny', 3500),
        ('diamniadio', 'Diamniadio', 3500),
        ('sebikotane', 'Sébikotane', 4000),
        ('autre-destination-plus-eloignee', 'Autre destination plus éloignée', None),
    ]),
]

# Alias tolérés en entrée (ex. sacre-coeur -> sacre-c-ur issu du slug JS de delivery.ts)
SLUG_ALIASES = {
    'sacre-coeur': 'sacre-c-ur',
}


def iter_delivery_areas():
    """Itère sur tous les quartiers officiels sous forme de dictionnaires."""
    for zone_num, zone_label, areas in DELIVERY_ZONES_DATA:
        for slug, name, fee in areas:
            yield {
                'slug': slug,
                'name': name,
                'zone': zone_num,
                'zone_label': zone_label,
                'fee': fee,
            }


def seed_delivery_areas(reset=False, model_cls=None):
    """Peuple de façon idempotente la table `DeliveryArea`.

    Si `reset=False`, les frais éventuellement personnalisés en administration
    sur un quartier existant sont préservés.
    Retourne `(created_count, updated_count)`.
    """
    cls = model_cls or DeliveryArea
    created_count = 0
    updated_count = 0

    for entry in iter_delivery_areas():
        if reset:
            _, created = cls.objects.update_or_create(
                slug=entry['slug'],
                defaults={
                    'name': entry['name'],
                    'zone': entry['zone'],
                    'zone_label': entry['zone_label'],
                    'fee': entry['fee'],
                    'is_active': True,
                },
            )
        else:
            existing = cls.objects.filter(slug=entry['slug']).first()
            if existing:
                existing.name = entry['name']
                existing.zone = entry['zone']
                existing.zone_label = entry['zone_label']
                existing.save(update_fields=['name', 'zone', 'zone_label'])
                created = False
            else:
                cls.objects.create(
                    slug=entry['slug'],
                    name=entry['name'],
                    zone=entry['zone'],
                    zone_label=entry['zone_label'],
                    fee=entry['fee'],
                    is_active=True,
                )
                created = True

        if created:
            created_count += 1
        else:
            updated_count += 1

    return created_count, updated_count


def resolve_delivery_area(raw_slug: str):
    """Recherche un quartier actif par son identifiant (`slug`).

    Si la table `DeliveryArea` est vide (ex. `TransactionTestCase` ayant vidé les tables),
    elle est initialisée automatiquement avec la grille officielle.
    """
    if not raw_slug or not isinstance(raw_slug, str):
        return None
    slug = raw_slug.strip().lower()
    if not slug:
        return None

    if not DeliveryArea.objects.exists():
        seed_delivery_areas(reset=False)

    canonical = SLUG_ALIASES.get(slug, slug)
    return DeliveryArea.objects.filter(slug=canonical, is_active=True).first()


def normalize_phone_for_comparison(raw_phone: str) -> str:
    """Normalise un numéro de téléphone pour comparaison (suppression des espaces,
    tirets, points, parenthèses et de l'indicatif sénégalais +221 / 00221)."""
    if not raw_phone or not isinstance(raw_phone, str):
        return ''
    cleaned = re.sub(r'[\s\.\-\(\)]', '', raw_phone.strip())
    match = re.match(r'^(?:\+221|00221|221)?([73]\d{8})$', cleaned)
    if match:
        return match.group(1)
    return cleaned


def phones_match(phone_a: str, phone_b: str) -> bool:
    """Vérifie si deux numéros de téléphone désignent le même client."""
    norm_a = normalize_phone_for_comparison(phone_a)
    norm_b = normalize_phone_for_comparison(phone_b)
    return bool(norm_a and norm_b and norm_a == norm_b)
