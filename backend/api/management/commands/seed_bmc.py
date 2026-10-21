from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from api.models import Category, MenuItem

class Command(BaseCommand):
    help = "Charge le menu complet et authentique de BMC FOOD avec le Plat du Jour de façon idempotente et non-destructive."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help=(
                "Force la réinitialisation de tous les champs aux valeurs par défaut du catalogue "
                "(écrase les prix, descriptions, disponibilités et plats du jour modifiés en admin)."
            ),
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)
        mode_label = "FORCÉ (--reset)" if reset else "NON-DESTRUCTIF (préserve les modifications admin)"
        self.stdout.write(f"Initialisation du catalogue BMC FOOD en mode {mode_label}...")

        catalog = [
            # 1. Tacos panés
            {
                "category": "Tacos panés",
                "icon": "Flame",
                "items": [
                    {"code": "tp-1", "name": "Tacos viande pané", "price": 3500, "desc": "Viande hachée assaisonnée, frites croustillantes, sauce fromagère maison et panure dorée.", "popular": True, "special": False},
                    {"code": "tp-2", "name": "Tacos poulet pané", "price": 3500, "desc": "Émincé de poulet mariné, sauce crémeuse, frites et galette croustillante panée.", "popular": True, "special": False},
                    {"code": "tp-3", "name": "Tacos mixte pané", "price": 4000, "desc": "Duo savoureux poulet et viande hachée, sauce au choix et panure croustillante.", "popular": True, "special": False},
                    {"code": "tp-4", "name": "Tacos jambon pané", "price": 3000, "desc": "Jambon savoureux, sauce fromagère onctueuse, frites et galette dorée panée.", "popular": False, "special": False},
                ]
            },
            # 2. Tacos jambon pané
            {
                "category": "Tacos jambon pané",
                "icon": "Utensils",
                "items": [
                    {"code": "tjp-1", "name": "Tacos viande jambon pané", "price": 4500, "desc": "Viande hachée et jambon fondant, sauce au choix et panure dorée.", "popular": False, "special": False},
                    {"code": "tjp-2", "name": "Tacos poulet jambon pané", "price": 4500, "desc": "Poulet mariné, tranches de jambon, frites et sauce fromagère.", "popular": False, "special": False},
                    {"code": "tjp-3", "name": "Tacos mixte jambon pané", "price": 5000, "desc": "Mélange viande, poulet et jambon dans une galette panée croustillante.", "popular": True, "special": False},
                ]
            },
            # 3. Tacos Royal pané
            {
                "category": "Tacos Royal pané",
                "icon": "Crown",
                "items": [
                    {"code": "trp-1", "name": "Tacos viande jambon royal pané", "price": 5000, "desc": "Formule royale : viande, jambon, fromage double dose, pané croustillant.", "popular": False, "special": False},
                    {"code": "trp-2", "name": "Tacos poulet jambon royal pané", "price": 5000, "desc": "Poulet royal, jambon, galette dorée et sauce onctueuse.", "popular": False, "special": False},
                    {"code": "trp-3", "name": "Tacos mixte jambon royal pané", "price": 6000, "desc": "Le suprême BMC : viande, poulet, jambon, garniture royale panée.", "popular": True, "special": True}, # Plat du Jour par excellence !
                    {"code": "trp-4", "name": "Tacos viande royal pané", "price": 4000, "desc": "Viande hachée royal, galette panée avec supplément cheddar fondu.", "popular": False, "special": False},
                    {"code": "trp-5", "name": "Tacos poulet royal pané", "price": 4000, "desc": "Poulet royal fondant, frites fraîches et panure croustillante.", "popular": False, "special": False},
                    {"code": "trp-6", "name": "Tacos mixte royal pané", "price": 4500, "desc": "Viande et poulet royal avec sauce au choix et panure.", "popular": False, "special": False},
                ]
            },
            # 4. Tacos Hot Dog pané
            {
                "category": "Tacos Hot Dog pané",
                "icon": "Zap",
                "items": [
                    {"code": "thp-1", "name": "Tacos viande hot dog pané", "price": 4500, "desc": "Saucisse hot dog & viande hachée, sauce barbecue et panure dorée.", "popular": False, "special": False},
                    {"code": "thp-2", "name": "Tacos poulet hot dog pané", "price": 4500, "desc": "Saucisse hot dog & poulet mariné, frites et sauce fromagère.", "popular": False, "special": False},
                    {"code": "thp-3", "name": "Tacos mixte hot dog pané", "price": 5000, "desc": "Poulet, viande, saucisse hot dog gourmande et panure croustillante.", "popular": False, "special": False},
                    {"code": "thp-4", "name": "Tacos viande hot dog royal pané", "price": 5000, "desc": "Viande, hot dog et garniture royale sous panure dorée.", "popular": False, "special": False},
                    {"code": "thp-5", "name": "Tacos poulet hot dog royal pané", "price": 5000, "desc": "Poulet royal, hot dog, fromage coulant et panure.", "popular": False, "special": False},
                    {"code": "thp-6", "name": "Tacos mixte hot dog royal pané", "price": 6000, "desc": "La totale hot dog royal : 3 viandes, saucisse, fromage et panure.", "popular": True, "special": False},
                ]
            },
            # 5. Tacos XL pané
            {
                "category": "Tacos XL pané",
                "icon": "Maximize",
                "items": [
                    {"code": "txl-1", "name": "Tacos XL pané", "price": 6000, "desc": "Format géant ultra-gourmand pour les gros appétits, entièrement pané.", "popular": True, "special": False},
                ]
            },
            # 6. Burgers
            {
                "category": "Burgers",
                "icon": "Beef",
                "items": [
                    {"code": "bg-1", "name": "Burger complet", "price": 2000, "desc": "Steak pur bœuf, œuf, salade, tomate, oignons caramélisés et sauce burger maison.", "popular": True, "special": False},
                    {"code": "bg-2", "name": "Double burger", "price": 2500, "desc": "Deux steaks grillés, double cheddar coulant, sauce spéciale et pain toasté.", "popular": True, "special": False},
                    {"code": "bg-3", "name": "Burger jambon", "price": 2500, "desc": "Steak savoureux, tranches de jambon, fromage fondu et légumes frais.", "popular": False, "special": False},
                    {"code": "bg-4", "name": "Burger royal", "price": 3000, "desc": "Double steak, œuf, bacon/jambon, triple fromage et sauce chef.", "popular": True, "special": False},
                ]
            },
            # 7. Tacos simples (19 déclinaisons fidèles au docx officiel - Décision X1)
            {
                "category": "Tacos simples",
                "icon": "Utensils",
                "items": [
                    {"code": "ts-1", "name": "Tacos viande", "price": 2500, "desc": "Viande hachée assaisonnée, frites et sauce fromagère dans sa galette chaude.", "popular": False, "special": False},
                    {"code": "ts-2", "name": "Tacos poulet", "price": 2500, "desc": "Poulet mariné grillé, frites et sauce fromagère crémeuse.", "popular": False, "special": False},
                    {"code": "ts-3", "name": "Tacos mixte", "price": 3000, "desc": "Duo poulet et viande hachée, frites croustillantes et sauce.", "popular": True, "special": False},
                    {"code": "ts-4", "name": "Tacos jambon", "price": 2000, "desc": "Jambon tendre et sauce onctueuse dans sa galette dorée.", "popular": False, "special": False},
                    {"code": "ts-5", "name": "Tacos viande jambon", "price": 3500, "desc": "Viande hachée assaisonnée et tranches de jambon savoureuses.", "popular": False, "special": False},
                    {"code": "ts-6", "name": "Tacos poulet jambon", "price": 3500, "desc": "Poulet fondant, tranches de jambon et sauce maison.", "popular": False, "special": False},
                    {"code": "ts-7", "name": "Tacos mixte jambon", "price": 4000, "desc": "Trio gourmand poulet, viande et jambon avec frites.", "popular": False, "special": False},
                    {"code": "ts-8", "name": "Tacos viande jambon royal", "price": 4000, "desc": "Viande hachée, jambon, sauce fromagère royale et frites.", "popular": False, "special": False},
                    {"code": "ts-9", "name": "Tacos poulet jambon royal", "price": 4000, "desc": "Poulet mariné, jambon et garniture royale fondante.", "popular": False, "special": False},
                    {"code": "ts-10", "name": "Tacos mixte jambon royal", "price": 5000, "desc": "Le grand classique royal : viande, poulet et jambon.", "popular": False, "special": False},
                    {"code": "ts-11", "name": "Tacos viande royal", "price": 3000, "desc": "Viande hachée assaisonnée avec garniture royale.", "popular": False, "special": False},
                    {"code": "ts-12", "name": "Tacos poulet royal", "price": 3000, "desc": "Poulet grillé tendre avec garniture royale.", "popular": False, "special": False},
                    {"code": "ts-13", "name": "Tacos mixte royal", "price": 3500, "desc": "Poulet mariné et viande hachée en version royale.", "popular": False, "special": False},
                    {"code": "ts-14", "name": "Tacos viande hot dog", "price": 3500, "desc": "Saucisse hot dog et viande hachée avec sauce au choix.", "popular": False, "special": False},
                    {"code": "ts-15", "name": "Tacos poulet hot dog", "price": 3500, "desc": "Saucisse hot dog et poulet grillé avec frites.", "popular": False, "special": False},
                    {"code": "ts-16", "name": "Tacos mixte hot dog", "price": 4000, "desc": "Duo viandes et saucisse hot dog dans sa galette.", "popular": False, "special": False},
                    {"code": "ts-17", "name": "Tacos viande hot dog royal", "price": 4500, "desc": "Viande, saucisse hot dog et garniture royale.", "popular": False, "special": False},
                    {"code": "ts-18", "name": "Tacos poulet hot dog royal", "price": 4500, "desc": "Poulet, saucisse hot dog et garniture royale.", "popular": False, "special": False},
                    {"code": "ts-19", "name": "Tacos XL simple", "price": 5000, "desc": "Format géant classique pour les gros appétits.", "popular": False, "special": False},
                ]
            }
        ]

        cats_created = 0
        cats_updated = 0
        items_created = 0
        items_updated = 0

        with transaction.atomic():
            for group in catalog:
                category, cat_created = Category.objects.update_or_create(
                    name=group["category"],
                    defaults={
                        "slug": slugify(group["category"]),
                        "icon": group.get("icon", "Utensils")
                    }
                )
                if cat_created:
                    cats_created += 1
                else:
                    cats_updated += 1

                for item_data in group["items"]:
                    image_slug = slugify(item_data["name"])
                    image_url = f"/images/products/{image_slug}.webp"

                    if reset:
                        item, itm_created = MenuItem.objects.update_or_create(
                            code=item_data["code"],
                            defaults={
                                "category": category,
                                "name": item_data["name"],
                                "price": item_data["price"],
                                "description": item_data["desc"],
                                "popular": item_data["popular"],
                                "is_daily_special": item_data["special"],
                                "is_available": True,
                                "image_url": image_url,
                            }
                        )
                    else:
                        item = MenuItem.objects.filter(code=item_data["code"]).first()
                        if item:
                            # Mode non-destructif (P10) : on préserve les modifications
                            # apportées par l'administrateur (prix, description, disponibilité, plat du jour).
                            item.category = category
                            item.name = item_data["name"]
                            item.popular = item_data["popular"]
                            if not item.image_url:
                                item.image_url = image_url
                            item.save()
                            itm_created = False
                        else:
                            item = MenuItem.objects.create(
                                code=item_data["code"],
                                category=category,
                                name=item_data["name"],
                                price=item_data["price"],
                                description=item_data["desc"],
                                popular=item_data["popular"],
                                is_daily_special=item_data["special"],
                                is_available=True,
                                image_url=image_url,
                            )
                            itm_created = True

                    if itm_created:
                        items_created += 1
                    else:
                        items_updated += 1

        total_categories = Category.objects.count()
        total_items = MenuItem.objects.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Succès : Seed {mode_label} terminé. "
                f"Catégories (créées: {cats_created}, màj: {cats_updated}, total: {total_categories}) | "
                f"Articles (créés: {items_created}, màj: {items_updated}, total: {total_items})."
            )
        )
