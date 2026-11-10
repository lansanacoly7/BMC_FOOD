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
    'preparing': ('delivering', 'cancelled'),
    'delivering': ('delivered',),
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


def check_order_opening_hours(dt=None) -> str | None:
    """
    Retourne None si le restaurant est ouvert (ou si la règle est désactivée par configuration).
    Retourne un message d'erreur si le restaurant est actuellement fermé.
    """
    from django.conf import settings
    if not getattr(settings, 'BMC_ENFORCE_OPENING_HOURS', True):
        return None

    if not is_restaurant_open(dt):
        return (
            "Le restaurant BMC Food est actuellement fermé pour les commandes. "
            "Horaires d'ouverture : du mardi au dimanche, de 11h00 à 02h00 du matin (fuseau de Dakar)."
        )
    return None
