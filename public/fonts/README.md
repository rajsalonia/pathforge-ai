# Locally served workspace fonts

These WOFF2 files are static assets for `app/components/workspace-v2`. They do not replace fonts in the current application until the new workspace is integrated.

- `pathforge-inter-latin.woff2`: Inter variable weight, Latin subset, `@fontsource-variable/inter` 5.3.0.
- `pathforge-jetbrains-mono-latin.woff2`: JetBrains Mono variable weight, Latin subset, `@fontsource-variable/jetbrains-mono` 5.3.0.
- `pathforge-devanagari.woff2`: Noto Sans Devanagari variable weight, Devanagari subset, `@fontsource-variable/noto-sans-devanagari` 5.3.0.

Retrieved from the npm registry with npm's standard integrity/TLS verification. Original SIL Open Font Licenses are included alongside the fonts. The internal CSS family names isolate this component package from the active application. System and monospace fallbacks remain available.

No build-time or browser request to a font CDN is required.
