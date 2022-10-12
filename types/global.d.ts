declare namespace NodeJS {
  interface Process {
    env: ProcessEnv
  }
  interface ProcessEnv {
    NODE_ENV: string
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_KEY: string
    NEXT_PUBLIC_REDIRECT_TO: string
  }
}
