# ICE_TECH — Bijouterie de luxe (Cameroun)

Site vitrine e-commerce pour **ICE_TECH — All in Jewelry**. Esthétique classe, ultra-moderne et glacée (inspiration Icebox × Tiffany & Co. × GLD), pensée pour une clientèle haut de gamme à **Douala** et **Yaoundé**.

## Aperçu

Site statique (HTML / CSS / JavaScript vanilla) — aucune dépendance, aucun build. Le panier est persistant via `localStorage`.

| Page | Fichier | Contenu |
|------|---------|---------|
| Accueil | `index.html` | Hero vidéo + tagline, "Shop by Category", produits vedettes, CTA grills, consultation |
| Collection | `products.html` | Catalogue filtrable (catégorie, matériau), tri |
| Produit | `product.html` | Galerie zoom, sélecteurs matériaux, quantité, ajout panier, consultation grill |
| Panier & Commande | `cart.html` | Récap, livraison localisée, Mobile Money / Orange Money / paiement à la livraison / carte |

## Palette & typographie

- **Fond** : noir minuit `#0a0b0d` / charbon `#111317`
- **Accents** : ice-blue `#8fe3ff`, platine `#e9edf2`, or `#d8b675`
- **Typo** : serif `Cormorant Garamond` (titres) + sans-serif géométrique `Manrope` (UI)

## Lancer le site

Ouvrez simplement `index.html` dans un navigateur, ou via un serveur local :

```bash
# Python
python -m http.server 5500

# ou Node
npx serve .
```

Puis ouvrez http://localhost:5500

## Structure

```
ICE_TECH/
├── index.html        # Accueil
├── products.html     # Catalogue
├── product.html      # Fiche produit
├── cart.html         # Panier & checkout
├── css/styles.css    # Design system
├── js/data.js        # Catalogue produits, livraison, paiements
├── js/app.js         # Panier, rendu, zoom, modale, interactions
└── assets/           # Visuels de marque
```

## Personnalisation

- **Produits / prix** : éditez `js/data.js` (`PRODUCTS`, prix en FCFA).
- **Livraison & paiements** : `SHIPPING_OPTIONS` et `PAYMENT_OPTIONS` dans `js/data.js`.
- **Vidéo hero** : remplacez la balise `<source>` dans `index.html` par votre footage de bijoux.
- **Images produits** : les glyphes peuvent être remplacés par de vraies photos HD dans les cartes produits / la galerie.

## Notes d'intégration (prod)

Les paiements et formulaires sont des simulations front-end. Pour la mise en production, brancher :
- **MTN MoMo / Orange Money** : API marchand (collecte de paiement) côté serveur.
- **Formulaires** (consultation, commande) : endpoint backend ou service type Formspree / WhatsApp Business API.
