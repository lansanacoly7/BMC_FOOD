#!/usr/bin/env python3
"""
Script d'optimisation automatique des images BMC FOOD.
Format cible : WebP 800x600 px, ratio 4:3, qualité 82%, poids 40-80 Ko.
"""
import sys
import os
from PIL import Image

def optimize_image(src_path, dst_path, size=(800, 600), quality=82):
    if not os.path.exists(src_path):
        print(f"Erreur : Le fichier source '{src_path}' n'existe pas.")
        return False
    
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with Image.open(src_path) as im:
        im_resized = im.resize(size, Image.Resampling.LANCZOS)
        im_resized.save(dst_path, 'WEBP', quality=quality, method=6)
    
    file_size_ko = os.path.getsize(dst_path) / 1024
    print(f"Optimisé : {dst_path} ({file_size_ko:.1f} Ko)")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python optimize_assets.py <source_image> <destination_webp>")
        sys.exit(1)
    optimize_image(sys.argv[1], sys.argv[2])
