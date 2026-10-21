interface ImportMetaEnv {
  /** URL de base de l'API Django REST (ex. http://localhost:8000/api). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
