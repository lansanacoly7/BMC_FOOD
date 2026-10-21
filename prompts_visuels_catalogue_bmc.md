# Recueil des Prompts & Charte Photographique — Catalogue BMC FOOD

> **Projet** : BMC FOOD — Dakar, Sénégal  
> **Auteure & Responsable Frontend** : Maimouna Sall  
> **Destinataires** : Pape Aliou Sène (Assets Visuels & Métier), El Hadji Massogui Diop (Lead Design), Lansana Coly (Lead Tech)  
> **Statut** : Référentiel normatif pour la génération et l'optimisation des 32 visuels  
> **Format cible** : Ratio 4:3 | Export WebP léger (< 80 Ko) | Résolution 800x600 px  

---

## 1. Directive Artistique Globale (Master Prompt Style)

Pour assurer une **parfaite cohérence visuelle** sur l'ensemble du site web et de l'application admin, chaque image doit respecter la même structure d'éclairage, d'arrière-plan et de stylisme culinaire.

### 🎯 Les Règles d'Or :
1. **Propreté & Maîtrise Culinaire** : Les plats doivent être gourmands, appétissants et généreux, mais **propres et nets** (pas de sauce excessive qui bave ou dégouline salement, garniture bien taillée et visible).
2. **Arrière-plan Signature** : Fond sombre texturé (ardoise noire ou bois sombre élégant `#18181B`) avec un éclairage chaud doré/ambré subtil (`#F59E0B`).
3. **Mise en Scène** : Le plat est le héros absolu, centré, présenté avec de légères herbes fraîches éparses ou un petit ramequin soigné en arrière-plan.
4. **Zéro Texte, Zéro Mockup** : Uniquement de la photographie culinaire pure, sans cadre de téléphone, sans logo incrusté, sans watermark.

---

## 2. Formule Standard de Prompt (Modèle Réutilisable)

Chaque prompt doit suivre cette trame éprouvée :
```text
Professional commercial food photography of [NOM ET DESCRIPTION DÉTAILLÉE DU PLAT], appetizing presentation, neatly assembled, balanced gourmet ingredients, fresh texture. Dark charcoal slate background with subtle warm amber rim lighting, shallow depth of field, high-end fast-casual restaurant style, clean and crisp details, no messy dripping sauce, 4:3 aspect ratio.
```

---

## 3. Prompts Détaillés par Catégorie de Plats (32 Produits)

---

### 🌮 Catégorie 1 : Les Tacos Panés (Spécialités Vedettes BMC)

#### 1.1 Tacos Viande Hachée Pané *(Plat du Jour)*
* **Nom fichier cible** : `tacos-viande-pane.webp`
* **Prompt** :
  ```text
  Professional food photography of a gourmet French Tacos filled with seasoned minced beef, crispy golden french fries, and rich creamy cheese sauce. The taco is cut in half diagonally showing neat, distinct layers of meat and fries, with a delicately grilled golden cheese crust on top. Dark charcoal background, warm amber side lighting, fresh chopped parsley garnish, appetizing and clean presentation, high resolution, no messy dripping.
  ```

#### 1.2 Tacos Poulet Pané
* **Nom fichier cible** : `tacos-poulet-pane.webp`
* **Prompt** :
  ```text
  Professional food photography of a golden toasted French Tacos filled with tender marinated chicken breast bites, crisp french fries, and smooth gourmet white sauce. Cut in half to reveal appetizing chicken pieces and golden fries, topped with a subtle gratin cheese finish. Dark slate background, warm ambient light, clean fast-casual restaurant style, perfectly assembled.
  ```

#### 1.3 Tacos Mixte Pané (Viande & Poulet)
* **Nom fichier cible** : `tacos-mixte-pane.webp`
* **Prompt** :
  ```text
  Commercial food photography of a large supreme French Tacos stuffed with a mix of seasoned minced meat and diced grilled chicken, golden fries, and signature BMC sauce. Clean diagonal cross-section showing generous layered filling, grilled tortilla with cheese crust. Dark stone tabletop, soft amber lighting, parsley flakes, crisp and delicious look.
  ```

#### 1.4 Tacos Cordon Bleu Pané
* **Nom fichier cible** : `tacos-cordon-bleu-pane.webp`
* **Prompt** :
  ```text
  Gourmet food photography of a French Tacos loaded with sliced crispy breaded cordon bleu, smoked turkey ham, melted cheese, and fries. Neatly cut in half showing the breaded chicken slices and cheese swirl, golden crispy crust on top. Dark elegant background, warm focused light, clean appetizing presentation.
  ```

---

### 🍔 Catégorie 2 : Les Burgers Gourmets

#### 2.1 Burger BMC Complet
* **Nom fichier cible** : `burger-bmc-complet.webp`
* **Prompt** :
  ```text
  Professional food photography of a gourmet double beef Burger neatly stacked in a shiny golden toasted brioche bun with sesame seeds. Layered with two juicy seasoned beef patties, neatly melted cheddar cheese slices, crisp fresh green lettuce, sliced ripe red tomato, and caramelized onions. Clean food styling, no overflowing or messy dripping sauce, dark slate background with warm rim light, premium street-food look.
  ```

#### 2.2 Burger Cheese Simple
* **Nom fichier cible** : `burger-cheese-simple.webp`
* **Prompt** :
  ```text
  Appetizing food photography of a classic Cheeseburger with a perfectly seared beef patty, a square of melted golden cheddar cheese clinging smoothly to the meat, crisp pickles, and ketchup in a soft toasted bun. Shot at eye level, dark textured background, warm spotlight, neat and mouth-watering presentation.
  ```

#### 2.3 Burger Poulet Croustillant (Crispy Chicken)
* **Nom fichier cible** : `burger-poulet-crispy.webp`
* **Prompt** :
  ```text
  Commercial food photography of a Crispy Fried Chicken Burger. Golden battered crunchy chicken breast fillet, creamy garlic mayo, fresh shredded iceberg lettuce, and sweet pickles inside a soft glossy brioche bun. Very clean presentation, golden crunchy texture highlighted by warm light, dark slate surface.
  ```

#### 2.4 Burger BMC Spécial Bacon / Boeuf Fumé
* **Nom fichier cible** : `burger-bmc-special.webp`
* **Prompt** :
  ```text
  Gourmet Burger featuring grilled seasoned beef patty, crispy beef bacon strips, smoked gouda cheese, and a dash of sweet barbecue glaze inside a toasted sesame bun. Neatly stacked, dark wood and slate background, warm golden highlights, premium culinary photography.
  ```

---

### 🌯 Catégorie 3 : Les Tacos Simples (Non Panés)

#### 3.1 Tacos Simple Viande Hachée
* **Nom fichier cible** : `tacos-simple-viande.webp`
* **Prompt** :
  ```text
  Professional food photography of a neatly wrapped French Tacos with grilled grill-marks on the flour tortilla. Cut in half showing seasoned minced beef, golden fries, and creamy cheese sauce inside. Clean tabletop with dark stone background, warm amber lighting, no spills, elegant presentation.
  ```

#### 3.2 Tacos Simple Poulet
* **Nom fichier cible** : `tacos-simple-poulet.webp`
* **Prompt** :
  ```text
  Appetizing food photography of a neatly pressed French Tacos with distinct grill marks. Halved to showcase marinated chicken cubes, golden fries, and mild pepper sauce. Dark backdrop, warm spotlight, parsley sprinkles on table, fresh and delicious look.
  ```

#### 3.3 Tacos Simple Merguez / Épicé
* **Nom fichier cible** : `tacos-simple-merguez.webp`
* **Prompt** :
  ```text
  High quality food photography of a grilled French Tacos stuffed with spicy sliced beef merguez sausage, golden french fries, and Algerian sauce. Cross section showing clean vibrant layers, dark rustic slate background, warm side lighting.
  ```

---

### 🥪 Catégorie 4 : Sandwichs & Wraps

#### 4.1 Sandwich Chawarma Dakar
* **Nom fichier cible** : `sandwich-chawarma.webp`
* **Prompt** :
  ```text
  Professional food photography of a Lebanese-style chicken Shawarma wrap, wrapped in thin toasted pita bread with grill marks. Sliced diagonally showing thinly sliced spiced chicken, garlic toum sauce, and pickled turnips. Clean wooden board on dark slate, warm focused light, authentic appetizing street-food.
  ```

#### 4.2 Sandwich Américain Steak & Frites
* **Nom fichier cible** : `sandwich-americain.webp`
* **Prompt** :
  ```text
  Appetizing food photography of a French baguette sandwich (Sandwich Américain) stuffed with grilled beef patties, golden french fries tucked inside, and melted cheese. Cut in half on a dark slate board, warm cozy lighting, clean and crisp presentation.
  ```

#### 4.3 Wrap Poulet Crudités
* **Nom fichier cible** : `wrap-poulet-crudites.webp`
* **Prompt** :
  ```text
  Fresh gourmet chicken wrap in a spinach or flour tortilla, tightly rolled and sliced diagonally. Showing grilled chicken breast strips, fresh crunchy lettuce, sweet corn, grated carrots, and light herbal sauce. Fresh, clean, healthy fast-food look, dark background with bright warm accents.
  ```

---

### 🍗 Catégorie 5 : Poulet, Tenders & Finger Food

#### 5.1 Tenders de Poulet Croustillants (x5)
* **Nom fichier cible** : `tenders-poulet.webp`
* **Prompt** :
  ```text
  Commercial food photography of 5 golden crispy fried chicken tenders stacked neatly in a small wire basket lined with greaseproof paper. Crunchy flakey breading, garnished with fresh thyme, served with a small neat ramekin of honey mustard sauce. Dark slate surface, warm backlight highlighting the crispy texture.
  ```

#### 5.2 Ailes de Poulet BBQ (Chicken Wings x6)
* **Nom fichier cible** : `chicken-wings-bbq.webp`
* **Prompt** :
  ```text
  Appetizing food photography of 6 grilled chicken wings coated in a glossy, rich barbecue glaze, sprinkled with toasted white sesame seeds. Arranged neatly on a dark matte plate, warm amber glow, clean and mouth-watering presentation without excessive sauce pools.
  ```

#### 5.3 Nuggets de Poulet Dorés (x6)
* **Nom fichier cible** : `nuggets-poulet.webp`
* **Prompt** :
  ```text
  Professional food photography of 6 golden brown chicken nuggets arranged neatly on a dark slate board with a tiny cup of ketchup. Crisp exterior texture, steam rising softly, clean studio lighting with warm golden tones.
  ```

---

### 🍟 Catégorie 6 : Frites & Accompagnements

#### 6.1 Frites Maison Croustillantes
* **Nom fichier cible** : `frites-maison.webp`
* **Prompt** :
  ```text
  Appetizing food photography of crispy golden French fries served in a modern black ceramic cup or cone. Sprinkled with sea salt and light paprika powder. Dark stone background with soft amber rim light, appetizing crunchy texture, clean food styling.
  ```

#### 6.2 Frites Cheddar & Oignons Frits
* **Nom fichier cible** : `frites-cheddar.webp`
* **Prompt** :
  ```text
  Gourmet loaded fries served in a cast iron skillet or dark bowl. Golden french fries topped neatly with warm melted yellow cheddar cheese and crispy fried onion flakes. Clean presentation, appetizing melted cheese coat, dark slate background with warm ambient light.
  ```

---

### 🥣 Catégorie 7 : Sauces Maison & Boissons

#### 7.1 Assortiment de Sauces Maison BMC (Fromagère, Algérienne, Samouraï)
* **Nom fichier cible** : `sauces-assortiment.webp`
* **Prompt** :
  ```text
  Commercial food photography of three small matching ceramic ramekins filled with gourmet sauces: creamy white cheese sauce, vibrant orange Algerian sauce, and spicy Samurai sauce. Arranged neatly in a row on dark wood with a few fresh herbs. Clean studio lighting, sharp details, smooth glossy sauce textures.
  ```

#### 7.2 Boissons Locales & Rafraîchissements (Bissap, Bouye, Canette)
* **Nom fichier cible** : `boissons-fraiches.webp`
* **Prompt** :
  ```text
  Chilled beverage photography featuring a tall condensation-covered glass of deep red hibiscus Bissap juice with a fresh mint sprig, next to a cold beverage can on ice cubes. Dark elegant slate background, glistening water droplets, refreshing and vibrant lighting.
  ```

---

## 4. Protocole d'Optimisation WebP (Spécification Mobile Dakar)

Dès qu'une image est générée ou photographiée :
1. **Redimensionnement** : `800 x 600 px` (format 4:3 parfait pour les cartes tactiles).
2. **Format** : `.webp` (Qualité 82%, méthode de compression 6).
3. **Poids strict** : Entre **50 Ko et 80 Ko** par image.
4. **Dossier de destination** : `client/public/images/products/`.

```bash
# Exemple de script d'optimisation automatique
python -c "
from PIL import Image
im = Image.open('source.jpg')
im = im.resize((800, 600), Image.Resampling.LANCZOS)
im.save('client/public/images/products/nom-du-plat.webp', 'WEBP', quality=82, method=6)
"
```
