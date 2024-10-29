/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORKFLOW_MANAGER_BASE_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
