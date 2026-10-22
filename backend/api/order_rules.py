"""
Règles métier des commandes (I3 — moteur de prix, I4 — cycle de vie).

Module volontairement sans dépendance à Django REST Framework : les constantes et
fonctions ci-dessous sont des points d'intégration stables pour les tests
(`api.order_rules.generate_order_ref` peut être remplacée par un test pour simuler
des collisions de références).

Décisions validées (voir docs/repartition_taches_backend.md) :
- D2  : cycle de vie linéaire sans saut ni retour arrière, annulation possible
        avant la livraison.
- D6  : statut de paiement modifiable par l'administration uniquement.
- D12 : 20 unités maximum par ligne, 30 lignes distinctes maximum après fusion.
"""
import secrets

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
    'pending': ('confirmed', 'preparing', 'cancelled'),
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
