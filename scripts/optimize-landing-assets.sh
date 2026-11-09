#!/usr/bin/env bash
#
# Regenerates hashed funnel imagery (brand, auth, install, home empty-states)
# from the full-resolution originals in src/assets/.
#
# Landing screenshots (today.png / how-*.png) are imported as-is and are not
# produced here.
#
# Requires: cwebp (brew install webp).

set -euo pipefail

cd "$(dirname "$0")/.."

SRC="src/assets"
OUT="src/assets/landing"
AUTH_OUT="src/assets/auth"
HOME_OUT="src/assets/home"

mkdir -p "$OUT" "$AUTH_OUT" "$HOME_OUT"

WEBP_Q=72

# webp <source> <basename> <width> <destination>
webp() {
  local src="$1" name="$2" width="$3" dest="$4"
  cwebp -quiet -q "$WEBP_Q" -resize "$width" 0 -metadata none "$src" -o "$dest/${name}-${width}.webp"
  printf '  %-34s %s\n' "${name}-${width}.webp" "$(du -h "$dest/${name}-${width}.webp" | cut -f1)"
}

# The header logo is 1024x1024 but never rendered above 92px. It sits above the
# fold on every page, so it is worth shipping at a sane size.
echo "brand mark (from awa.png 1024x1024):"
webp "$SRC/awa.png" brand 256 "$OUT"

# Every landing CTA lands on /register, so these are effectively part of the
# first paint of step two of the funnel. register.png is a decorative panel that
# sits behind an overlay, and sward.png is rendered in a 100px box.
echo "auth page art (from register.png 1248x832 / sward.png 1024x1024):"
webp "$SRC/register.png" auth-bg 1248 "$AUTH_OUT"
webp "$SRC/sward.png" auth-mark 256 "$AUTH_OUT"

# Shown only inside the PWA install modal, but 1284x2633 for a ~320px-wide slot.
echo "install instructions (from IMG_8932.jpeg / IMG_8933.jpeg):"
webp "$SRC/IMG_8932.jpeg" install-share 640 "$AUTH_OUT"
webp "$SRC/IMG_8933.jpeg" install-add 640 "$AUTH_OUT"

echo "home empty-state art (from treasure.png / tomorrow.png):"
webp "$SRC/treasure.png" treasure 280 "$HOME_OUT"
webp "$SRC/tomorrow.png" tomorrow 280 "$HOME_OUT"

echo
echo "originals:  $(du -ch "$SRC/register.png" "$SRC/sward.png" "$SRC/IMG_8932.jpeg" "$SRC/IMG_8933.jpeg" \
  "$SRC/treasure.png" "$SRC/tomorrow.png" "$SRC/awa.png" | tail -1 | cut -f1)"
echo "optimized:  $(du -ch "$OUT" "$AUTH_OUT" "$HOME_OUT" | tail -1 | cut -f1)"
