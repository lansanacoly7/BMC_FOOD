"""
Règles métier des commandes (I3 — moteur de prix, I4 — cycle de vie, Horaires d'ouverture).

Module volontairement sans dépendance à Django REST Framework : les constantes et
fonctions ci-dessous sont des points d'intégration stables pour les tests
(`api.order_rules.generate_order_ref` peut être remplacée par un test pour simuler
des collisions de références).

Décisions validées (voir docs/repartition_taches_backend.md) :
- D2  : cycle de vie linéaire sans saut ni retour arrière, annulation possible
        avant la livraison.
- D6  : statut de paiement modifiable par l'administration uniquement.
- D12 : 20 unités maximum par ligne, 30 lignes distinctes maximum après fusion.
- Horaires : Mardi au Dimanche de 11h00 à 02h00 du matin (fuseau Africa/Dakar).
"""
import re
import secrets
from zoneinfo import ZoneInfo
from django.utils import timezone

# --- I3 : panier et références ----------------------------------------------
MAX_QUANTITY_PER_LINE = 20
MAX_DISTINCT_LINES = 30

# Les montants sont des entiers en F CFA (pas de décimales) : aucun flottant n'est utilisé.
ORDER_REF_PREFIX = 'BMC-'
ORDER_REF_DIGITS = 6  # Décision X3 : 6 chiffres (1 000 000 de combinaisons sans collision)
ORDER_REF_MAX_ATTEMPTS = 25


def generate_order_ref():
    """Génère un candidat de référence `BMC-XXXXXX`. L'unicité n'est PAS garantie ici :
    elle est assurée par la contrainte unique de la base et la boucle de nouvelle
    tentative lors de la création de la commande."""
    number = secrets.randbelow(10 ** ORDER_REF_DIGITS)
    return f"{ORDER_REF_PREFIX}{number:0{ORDER_REF_DIGITS}d}"


# --- I4 : transitions autorisées --------------------------------------------
ORDER_STATUS_TRANSITIONS = {
    'pending': ('confirmed', 'cancelled'),
    'confirmed': ('preparing', 'cancelled'),
    'preparing': ('ready', 'delivering', 'cancelled'),
    'ready': ('delivering', 'delivered', 'cancelled'),
    'delivering': ('delivered', 'cancelled'),
    'delivered': (),
    'cancelled': (),
}

PAYMENT_STATUS_TRANSITIONS = {
    'unpaid': ('pending', 'paid'),
    'pending': ('paid',),
    'paid': ('refund_pending',),
    'refund_pending': (),
}


def _validate_transition(label, transitions, current, new):
    """Retourne un message d'erreur, ou None si le changement est autorisé.

    Demander l'état courant n'est pas une transition : l'opération est acceptée
    sans effet (idempotence en cas de nouvelle tentative réseau)."""
    if new == current:
        return None
    allowed = transitions.get(current, ())
    if new in allowed:
        return None
    if allowed:
        return (
            f"Transition {label} interdite : « {current} » → « {new} ». "
            f"Depuis « {current} », seuls sont autorisés : {', '.join(allowed)}."
        )
    return (
        f"Transition {label} interdite : « {current} » est un état final, "
        f"il ne peut plus être modifié."
    )


def validate_order_status_transition(current, new):
    return _validate_transition('de statut de commande', ORDER_STATUS_TRANSITIONS, current, new)


def validate_payment_status_transition(current, new):
    return _validate_transition('de statut de paiement', PAYMENT_STATUS_TRANSITIONS, current, new)


# --- Horaires d'ouverture ----------------------------------------------------
RESTAURANT_TIMEZONE = 'Africa/Dakar'


def is_restaurant_open(dt=None) -> bool:
    """
    Vérifie si le restaurant BMC Food est ouvert au moment donné (fuseau Africa/Dakar).

    Horaires officiels :
    - Du Mardi au Dimanche : de 11h00 à 02h00 du matin (nuit suivante).
    - Fermé :
      * Chaque jour entre 02h00 et 11h00 du matin.
      * Toute la journée du Lundi à partir de 02h00 du matin jusqu'au Mardi 11h00.
    """
    if dt is None:
        dt = timezone.now()

    dakar_tz = ZoneInfo(RESTAURANT_TIMEZONE)
    local_dt = dt.astimezone(dakar_tz) if dt.tzinfo else dt.replace(tzinfo=dakar_tz)

    weekday = local_dt.weekday()  # 0 = Lundi, 1 = Mardi, ..., 6 = Dimanche
    hour = local_dt.hour

    # 1. Fermé tous les jours entre 02h00 et 10h59
    if 2 <= hour < 11:
        return False

    # 2. De 11h00 à 23h59 : ouvert du Mardi (1) au Dimanche (6), fermé le Lundi (0)
    if hour >= 11:
        return weekday != 0

    # 3. De 00h00 à 01h59 (après minuit) : prolongation du service du jour précédent.
    # Lundi 00h-02h : prolongation du service du dimanche soir -> OUVERT.
    # Mardi 00h-02h : prolongation du lundi (jour de fermeture) -> FERMÉ.
    # Mercredi à Dimanche 00h-02h -> OUVERT.
    return weekday != 1


def is_order_window_open(dt=None) -> bool:
    """
    Vérifie si les commandes sont acceptées selon les horaires officiels :
    - Mardi au Dimanche : de 11h00 à 01h30 du matin (dernière commande à 01h30 incluse).
    - Fermé aux commandes :
      * De 01h31 à 10h59 chaque jour.
      * Toute la journée du Lundi à partir de 01h31 jusqu'au Mardi 11h00.
    """
    if dt is None:
        dt = timezone.now()

    dakar_tz = ZoneInfo(RESTAURANT_TIMEZONE)
    local_dt = dt.astimezone(dakar_tz) if dt.tzinfo else dt.replace(tzinfo=dakar_tz)

    weekday = local_dt.weekday()  # 0 = Lundi, 1 = Mardi, ..., 6 = Dimanche
    hour = local_dt.hour
    minute = local_dt.minute

    # 1. Fermé tous les jours entre 02h00 et 10h59
    if 2 <= hour < 11:
        return False

    # 2. De 11h00 à 23h59 : ouvert du Mardi (1) au Dimanche (6), fermé le Lundi (0)
    if hour >= 11:
        return weekday != 0

    # 3. Entre 00h00 et 01h59 (après minuit) : prolongation du service de la veille.
    # Mardi 00h-02h : prolongation du lundi (jour de fermeture) -> FERMÉ.
    if weekday == 1:
        return False

    # Dimanche soir prolongé sur Lundi 00h-01h30, et Mercredi-Dimanche 00h-01h30 -> OUVERT.
    # Après 01h30 (01h31 à 01h59) -> FERMÉ aux commandes (dernière commande à 01h30 incluse).
    if hour == 1 and minute > 30:
        return False

    return True


def is_restaurant_accepting_orders(dt=None) -> tuple[bool, str]:
    """
    Détermine si le restaurant accepte actuellement les commandes.
    Prend en compte :
    1. L'interrupteur manuel / pause cuisine (RestaurantSettings.manual_closed).
    2. La fenêtre horaire de commande (11h00 à 01h30).
    3. La configuration BMC_ENFORCE_OPENING_HOURS (pour dev/tests).

    Retourne un tuple (accepting: bool, message: str).
    """
    from django.conf import settings
    from .models import RestaurantSettings

    # 1. Vérification de l'interrupteur manuel / pause cuisine
    try:
        store_settings = RestaurantSettings.get_settings()
        if store_settings.manual_closed:
            msg = store_settings.closed_message.strip() or "Le restaurant BMC Food est temporairement fermé pour les commandes (pause cuisine)."
            return False, msg
    except Exception:
        pass

    # 2. Vérification de l'activation des horaires (désactivable en dev/test via settings)
    if not getattr(settings, 'BMC_ENFORCE_OPENING_HOURS', True):
        return True, ""

    # 3. Vérification de la fenêtre horaire (dernière commande à 01h30)
    if not is_order_window_open(dt):
        return False, (
            "Le restaurant BMC Food est actuellement fermé pour les commandes. "
            "Horaires de commande : du mardi au dimanche, de 11h00 à 01h30 du matin (dernière commande à 01h30, fermeture du restaurant à 02h00)."
        )

    return True, ""


def check_order_opening_hours(dt=None) -> str | None:
    """
    Retourne None si le restaurant accepte les commandes.
    Retourne un message d'erreur si le restaurant est fermé ou en pause.
    """
    accepting, msg = is_restaurant_accepting_orders(dt)
    if not accepting:
        return msg
    return None


# --- Garde-fous de commande (Section 2 - Pathé Fall) ------------------------
MAX_ORDER_AMOUNT = 250000  # 250 000 F CFA montant maximal par commande
MAX_NOTE_LENGTH = 500      # 500 caractères maximum pour la note
MAX_ORDER_TOTAL_QUANTITY = 50  # 50 articles maximum au total par commande
SENEGAL_PHONE_REGEX = re.compile(r'^(?:\+221|00221)?([73]\d{8})$')


def validate_and_normalize_phone(raw_phone: str) -> str:
    """
    Valide que le numéro est un numéro sénégalais valide (mobile 7X ou fixe 33, 9 chiffres).
    Normalise le numéro au format international standard '+221XXXXXXXXX'.
    Lève ValueError si invalide.
    """
    cleaned = re.sub(r'[\s\.\-\(\)]', '', str(raw_phone or '').strip())
    match = SENEGAL_PHONE_REGEX.match(cleaned)
    if not match:
        raise ValueError("Numéro de téléphone sénégalais invalide (ex: 77 123 45 67 ou +221 77 123 45 67).")
    return f"+221{match.group(1)}"


# --- Frais de livraison (docs/frais_livraison_bmc.md) ------------------------
DELIVERY_AREAS_FEES = {
    # Zone 1 : Très proche (1 000 F)
    'cite-mixta': 1000,
    'grand-yoff': 1000,
    'patte-d-oie': 1000,
    'arafat': 1000,
    # Zone 2 : Proche (1 500 F)
    'nord-foire': 1500,
    'foire': 1500,
    'liberte-5': 1500,
    'liberte-6': 1500,
    'hlm': 1500,
    'dieuppeul': 1500,
    'cite-des-eaux': 1500,
    # Zone 3 : Dakar nord (1 500 - 2 000 F)
    'parcelles-assainies': 1500,
    'yoff': 1500,
    'ouest-foire': 1500,
    'camberene': 2000,
    'tivaouane-peulh': 2000,
    # Zone 4 : Dakar centre (2 000 F)
    'sacre-coeur': 2000,
    'sicap': 2000,
    'castors': 2000,
    'amitie': 2000,
    'fann': 2000,
    'point-e': 2000,
    'fass': 2000,
    'medina': 2000,
    # Zone 5 : Dakar ouest (2 500 F)
    'mermoz': 2500,
    'ouakam': 2500,
    'ngor': 2500,
    'almadies': 2500,
    'mamelles': 2500,
    'corniche-ouest': 2500,
    # Zone 6 : Plateau et sud (2 500 F)
    'plateau': 2500,
    'colobane': 2500,
    'rebeuss': 2500,
    'gueule-tapee': 2500,
    'hann-maristes': 2500,
    'hann-bel-air': 2500,
    # Zone 7 : Banlieue proche (3 000 F)
    'pikine': 3000,
    'dalifort': 3000,
    'thiaroye': 3000,
    'guediawaye': 3000,
    'golf-sud': 3000,
    'yeumbeul': 3000,
    # Zone 8 : Banlieue éloignée (3 000 - 3 500 F)
    'keur-massar': 3000,
    'malika': 3500,
    'jaxaay': 3500,
    'rufisque': 3500,
    'sangalkam': 3500,
    # Zone 9 : Longue distance (3 500 - 4 000 F)
    'bargny': 3500,
    'diamniadio': 3500,
    'sebikotane': 4000,
    'autre-destination-plus-eloignee': 0,
}


def get_delivery_fee(area_id: str | None) -> int:
    """Retourne les frais de livraison en F CFA pour le quartier donné (0 si inconnu ou emporter)."""
    if not area_id:
        return 0
    return DELIVERY_AREAS_FEES.get(str(area_id).strip().lower(), 0)
