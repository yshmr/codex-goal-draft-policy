# API client migration

Replace the legacy callback adapter with the promise adapter while preserving the exported `add(a, b)` behavior. Do not add dependencies or change the public function signature. Verification surfaces are `npm test` and `npm run lint`.
