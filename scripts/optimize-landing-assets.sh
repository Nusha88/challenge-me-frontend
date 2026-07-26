#!/usr/bin/env bash
#
# Regenerates the responsive images for the acquisition funnel -- the landing
# page and the login/register pages it feeds into -- from the full-resolution
# originals in src/assets/.
#
# The originals are intentionally kept in the repo as masters but are never
# shipped: home_page.jpg is 2048x2048/4.2MB and demo.png is 2992x1710/2.2MB,
# while the largest slot either one ever occupies on screen is ~900px and
# ~1160px CSS pixels respectively.
#
# Requires: cwebp (brew install webp) and sips (bundled with macOS).

set -euo pipefail

cd "$(dirname "$0")/.."

SRC="src/assets"

# Below-the-fold imagery is imported through Vite so it gets content-hashed.
OUT="src/assets/landing"

# The hero is the LCP element. In a client-rendered SPA a hashed import cannot be
# fetched until the JS bundle has parsed, so it lives in public/ under a stable
# path that index.html can <link rel="preload"> during HTML parsing instead.
# Renaming these files requires updating index.html and LandingHero.vue.
PUBLIC_OUT="public/landing"

mkdir -p "$OUT" "$PUBLIC_OUT"

WEBP_Q=72
JPEG_Q=80

# webp <source> <basename> <width> <destination>
webp() {
  local src="$1" name="$2" width="$3" dest="$4"
  cwebp -quiet -q "$WEBP_Q" -resize "$width" 0 -metadata none "$src" -o "$dest/${name}-${width}.webp"
  printf '  %-34s %s\n' "${name}-${width}.webp" "$(du -h "$dest/${name}-${width}.webp" | cut -f1)"
}

# jpeg <source> <basename> <width> <destination>  (fallback for browsers without webp)
jpeg() {
  local src="$1" name="$2" width="$3" dest="$4"
  sips --resampleWidth "$width" -s format jpeg -s formatOptions "$JPEG_Q" \
    "$src" --out "$dest/${name}-${width}.jpg" >/dev/null
  printf '  %-34s %s\n' "${name}-${width}.jpg" "$(du -h "$dest/${name}-${width}.jpg" | cut -f1)"
}

echo "hero artifact -> $PUBLIC_OUT (from home_page.jpg 2048x2048):"
webp "$SRC/home_page.jpg" hero 460 "$PUBLIC_OUT"
webp "$SRC/home_page.jpg" hero 900 "$PUBLIC_OUT"
jpeg "$SRC/home_page.jpg" hero 900 "$PUBLIC_OUT"

echo "dashboard screenshot (from demo.png 2992x1710):"
webp "$SRC/demo.png" demo 800 "$OUT"
webp "$SRC/demo.png" demo 1600 "$OUT"
jpeg "$SRC/demo.png" demo 1600 "$OUT"

echo "phone screenshots (from today.jpeg / today_en.jpeg):"
webp "$SRC/today.jpeg" screen-today-ru 420 "$OUT"
webp "$SRC/today_en.jpeg" screen-today-en 420 "$OUT"

# The header logo is 1024x1024 but never rendered above 92px. It sits above the
# fold on every page, so it is worth shipping at a sane size.
echo "brand mark (from awa.png 1024x1024):"
webp "$SRC/awa.png" brand 256 "$OUT"

# Every landing CTA lands on /register, so these are effectively part of the
# first paint of step two of the funnel. register.png is a decorative panel that
# sits behind an overlay, and sward.png is rendered in a 100px box.
AUTH_OUT="src/assets/auth"
mkdir -p "$AUTH_OUT"

echo "auth page art (from register.png 1248x832 / sward.png 1024x1024):"
webp "$SRC/register.png" auth-bg 1248 "$AUTH_OUT"
webp "$SRC/sward.png" auth-mark 256 "$AUTH_OUT"

# Shown only inside the PWA install modal, but 1284x2633 for a ~320px-wide slot.
echo "install instructions (from IMG_8932.jpeg / IMG_8933.jpeg):"
webp "$SRC/IMG_8932.jpeg" install-share 640 "$AUTH_OUT"
webp "$SRC/IMG_8933.jpeg" install-add 640 "$AUTH_OUT"

# Logged-in home art: greeting crystal + empty-state illustrations.
HOME_OUT="src/assets/home"
mkdir -p "$HOME_OUT"

echo "home art (from crystal.png / treasure.png / tomorrow.png):"
webp "$SRC/crystal.png" crystal 320 "$HOME_OUT"
webp "$SRC/treasure.png" treasure 280 "$HOME_OUT"
webp "$SRC/tomorrow.png" tomorrow 280 "$HOME_OUT"

echo
echo "originals:  $(du -ch "$SRC/home_page.jpg" "$SRC/demo.png" "$SRC/today.jpeg" "$SRC/today_en.jpeg" \
  "$SRC/register.png" "$SRC/sward.png" "$SRC/IMG_8932.jpeg" "$SRC/IMG_8933.jpeg" \
  "$SRC/crystal.png" "$SRC/treasure.png" "$SRC/tomorrow.png" | tail -1 | cut -f1)"
echo "optimized:  $(du -ch "$OUT" "$PUBLIC_OUT" "$AUTH_OUT" "$HOME_OUT" | tail -1 | cut -f1)"
