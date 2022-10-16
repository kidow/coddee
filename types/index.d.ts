interface ReactProps {
  children?: ReactNode
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  maxWidth?:
    | 'max-w-screen-2xl'
    | 'max-w-screen-xl'
    | 'max-w-screen-lg'
    | 'max-w-screen-md'
    | 'max-w-screen-sm'
    | 'max-w-full'
    | 'max-w-7xl'
    | 'max-w-6xl'
    | 'max-w-5xl'
    | 'max-w-4xl'
    | 'max-w-3xl'
    | 'max-w-2xl'
    | 'max-w-xl'
    | 'max-w-lg'
    | 'max-w-md'
    | 'max-w-sm'
    | 'max-w-xs'
  description?: ReactNode
  padding?: boolean
  footer?: ReactNode
}

namespace NTable {
  interface Users {
    id: string
    email: string
    nickname: string
    avatar_url: string
    introduction: string
    github_url: string
    blog_url: string
    field: string
    created_at: string
    updated_at: string
  }
  interface Rooms {
    id: string
    name: string
    logo_url: string
    created_at: string
    updated_at: string
    deleted_at: string
  }
  interface Chats {
    id: number
    user_id: string
    room_id: string
    content: string
    code_block: string
    language: string
    created_at: string
    deleted_at: string
  }
  interface Languages {
    id: number
    label: string
    value: string
    template: string
    created_at: string
  }
}
