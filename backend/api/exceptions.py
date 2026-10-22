"""
Gestion uniforme des erreurs de l'API (I6).

Contrat d'erreur (toutes les erreurs 4xx/5xx gérées par DRF) :

    {
      "success": false,
      "error": "<message lisible>",
      "errors": { "<champ>": ["<message>", ...] },   # validation (400) ; { "detail": ["<message>"] } sinon
      "code": "<code machine>"                       # uniquement pour les erreurs hors validation
    }

La clé `errors` (erreurs par champ au format DRF) est conservée pour rester
compatible avec les frontends existants.
"""
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

_DEFAULT_CODES = {
    status.HTTP_400_BAD_REQUEST: 'invalid',
    status.HTTP_401_UNAUTHORIZED: 'not_authenticated',
    status.HTTP_403_FORBIDDEN: 'permission_denied',
    status.HTTP_404_NOT_FOUND: 'not_found',
    status.HTTP_405_METHOD_NOT_ALLOWED: 'method_not_allowed',
    status.HTTP_429_TOO_MANY_REQUESTS: 'throttled',
    status.HTTP_503_SERVICE_UNAVAILABLE: 'service_unavailable',
}


class OrderReferenceUnavailable(APIException):
    """Aucune référence de commande unique n'a pu être attribuée après plusieurs tentatives."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Impossible d'attribuer une référence de commande unique pour le moment. Veuillez réessayer."
    default_code = 'order_reference_unavailable'


def first_message(data):
    """Premier message lisible d'une structure d'erreurs DRF imbriquée."""
    if isinstance(data, dict):
        for value in data.values():
            message = first_message(value)
            if message:
                return message
    elif isinstance(data, (list, tuple)):
        for value in data:
            message = first_message(value)
            if message:
                return message
    elif data is not None:
        return str(data)
    return None


def error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST, code=None):
    """Construit une réponse d'erreur conforme au contrat ci-dessus."""
    body = {'success': False, 'error': message}
    body['errors'] = errors if errors is not None else {'detail': [message]}
    if code is not None:
        body['code'] = code
    return Response(body, status=status_code)


def bmc_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, ValidationError):
        errors = response.data
        if isinstance(errors, list):
            errors = {'non_field_errors': errors}
        response.data = {
            'success': False,
            'error': first_message(errors) or 'Données invalides.',
            'errors': errors,
        }
        return response

    detail = response.data.get('detail') if isinstance(response.data, dict) else response.data
    code = getattr(getattr(exc, 'detail', None), 'code', None) or _DEFAULT_CODES.get(response.status_code, 'error')
    message = first_message(detail) or 'Erreur.'
    response.data = {
        'success': False,
        'error': message,
        'errors': {'detail': [message]},
        'code': code,
    }
    return response
