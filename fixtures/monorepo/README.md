# Monorepo fixture

Root validation and package validation are intentionally distinct. The CI workflow currently calls a package script name that package metadata does not define; evaluation must report the mismatch rather than silently selecting a replacement.
