/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_DEALER_ACE?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
