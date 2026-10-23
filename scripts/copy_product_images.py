import os
import shutil

source_dir = r"docs\assets\products"
target_dir = r"client_website\public\images\products"

os.makedirs(target_dir, exist_ok=True)

mapping = {
    # Tacos panés
    "tacos-viande-pane.webp": ["tacos-viande-pane.webp", "French_tacos_on_slate_20261021160400.webp"],
    "tacos-poulet-pane.webp": ["Cut_French_Tacos_Poulet_Pané_20261021175420.webp", "tacos-poulet-pane.webp"],
    "tacos-mixte-pane.webp": ["tacos-mixte-pane.webp", "French_Tacos_Mixte_Pané_20261021160635.webp"],
    "tacos-jambon-pane.webp": ["French_Tacos_Jambon_Pané_20261021161350.webp"],
    "tacos-cordon-bleu-pane.webp": ["tacos-cordon-bleu-pane.webp"],

    # Tacos jambon pané
    "tacos-viande-jambon-pane.webp": ["French_Tacos_Jambon_Pané_sliced_20261021175946.webp"],
    "tacos-poulet-jambon-pane.webp": ["French_Tacos_Pané_sliced_diagonally_20261021175232.webp"],
    "tacos-mixte-jambon-pane.webp": ["French_Tacos_Mixte_sliced_20261021172716.webp"],

    # Tacos Royal pané
    "tacos-viande-jambon-royal-pane.webp": ["Toasted_Royal_Tacos_with_sauce_20261021173905.webp"],
    "tacos-poulet-jambon-royal-pane.webp": ["French_tacos_sliced_on_slate_20261021175716.webp"],
    "tacos-mixte-jambon-royal-pane.webp": ["French_Tacos_Mixte_with_sauces_20261021175851.webp"],
    "tacos-viande-royal-pane.webp": ["French_tacos_sliced_with_sauces_20261021175219.webp"],
    "tacos-poulet-royal-pane.webp": ["French_tacos_served_with_fries_20261021172858.webp"],
    "tacos-mixte-royal-pane.webp": ["French_tacos_served_with_fries_20261021172906.webp"],

    # Tacos Hot Dog pané
    "tacos-viande-hot-dog-pane.webp": ["French_tacos_cut_in_half_20261021174603.webp", "French_Tacos_cut_in_half_20261021174603.webp"],
    "tacos-poulet-hot-dog-pane.webp": ["French_tacos_cut_in_half_20261021174717.webp", "French_Tacos_cut_in_half_20261021174717.webp"],
    "tacos-mixte-hot-dog-pane.webp": ["French_tacos_cut_in_half_20261021174723.webp", "French_Tacos_cut_in_half_20261021174723.webp"],
    "tacos-viande-hot-dog-royal-pane.webp": ["Toasted_French_tacos_on_dark_20261021174441.webp"],
    "tacos-poulet-hot-dog-royal-pane.webp": ["Grilled_French_tacos_with_filling_20261021174331.webp"],
    "tacos-mixte-hot-dog-royal-pane.webp": ["Grilled_French_tacos_halved_with…_20261021174336.webp"],

    # Tacos XL pané
    "tacos-xl-pane.webp": ["Large_taco_on_wood_20261021174801.webp"],

    # Burgers
    "burger-complet.webp": ["burger-bmc-complet.webp", "Burger_and_fries_on_slate_20261021171721.webp"],
    "burger-bmc-complet.webp": ["burger-bmc-complet.webp"],
    "double-burger.webp": ["Double_burger_with_barbecue_sauce_20261021170413.webp"],
    "burger-jambon.webp": ["Burger_with_cheese_and_meat_20261021171547.webp"],
    "burger-royal.webp": ["Burger_Royal_on_slate_background_20261021171914.webp"],
    "burger-poulet-crispy.webp": ["burger-poulet-crispy.webp"],
    "burger-cheese-simple.webp": ["burger-cheese-simple.webp"],

    # Tacos simples
    "tacos-viande.webp": ["French_tacos_on_slate_20261021160400.webp"],
    "tacos-poulet.webp": ["Chicken_French_tacos_with_sauce_20261021175811.webp"],
    "tacos-mixte.webp": ["French_tacos_on_wood_platter_20261021175858.webp"],
    "tacos-jambon.webp": ["Ham_French_Tacos_on_slate_20261021180049.webp"],
    "tacos-viande-jambon.webp": ["Sliced_French_tacos_on_platter_20261021175110.webp"],
    "tacos-poulet-jambon.webp": ["Sliced_French_tacos_with_fries_20261021175950.webp"],
    "tacos-mixte-jambon.webp": ["French_tacos_sliced_on_platter_20261021175118.webp"],
    "tacos-viande-jambon-royal.webp": ["French_tacos_with_mayonnaise_20261021180044.webp"],
    "tacos-poulet-jambon-royal.webp": ["French_tacos_with_Algerian_sauce_20261021172531.webp"],
    "tacos-mixte-jambon-royal.webp": ["Toasted_tacos_with_dipping_sauce_20261021174609.webp"],
    "tacos-viande-royal.webp": ["French_tacos_cut_in_half_20261021173736.webp"],
    "tacos-poulet-royal.webp": ["French_tacos_cut_in_half_20261021174539.webp"],
    "tacos-mixte-royal.webp": ["French_tacos_sliced_in_half_20261021172459.webp"],
    "tacos-viande-hot-dog.webp": ["French_tacos_with_sauce_cups_20261021173343.webp"],
    "tacos-poulet-hot-dog.webp": ["French_tacos_with_sauce_cups_20261021174434.webp"],
    "tacos-mixte-hot-dog.webp": ["Grilled_French_tacos_halved_20261021173237.webp"],
    "tacos-viande-hot-dog-royal.webp": ["Grilled_French_tacos_with_filling_20261021173339.webp"],
    "tacos-poulet-hot-dog-royal.webp": ["French_tacos_on_dark_background_20261021173349.webp"],
    "tacos-xl-simple.webp": ["French_Tacos_cut_in_half_20261021173727.webp"],
}

available_files = {f.lower(): f for f in os.listdir(source_dir)}
target_available = {f.lower(): f for f in os.listdir(target_dir)}

copied = 0
for target_name, candidates in mapping.items():
    found = False
    # Check if target already exists
    if target_name.lower() in target_available:
        found = True
        continue
    for c in candidates:
        if c.lower() in available_files:
            real_src = os.path.join(source_dir, available_files[c.lower()])
            dst = os.path.join(target_dir, target_name)
            shutil.copy2(real_src, dst)
            copied += 1
            found = True
            break
    if not found:
        # Fallback to general tacos/burger image if specific candidate not found
        fallback_src = os.path.join(target_dir, "tacos-viande-pane.webp")
        if "burger" in target_name:
            fallback_src = os.path.join(target_dir, "burger-bmc-complet.webp")
        if os.path.exists(fallback_src):
            dst = os.path.join(target_dir, target_name)
            shutil.copy2(fallback_src, dst)
            copied += 1

print(f"Copied {copied} files to {target_dir}")
