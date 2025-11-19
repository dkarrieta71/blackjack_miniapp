/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_DEALER_ACE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
