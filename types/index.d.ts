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
  error?: boolean
}

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: 'left' | 'top' | 'right' | 'bottom'
}

namespace NTable {
  interface Users {
    id: string
    email: string
    nickname: string
    avatar_url: string
    job_category: string
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
    modified_code: string
    modified_language: string
    language: string
    created_at: string
    updated_at: string
    deleted_at: string
  }
  interface Languages {
    id: number
    label: string
    value: string
    template: string
    created_at: string
  }
  interface Reactions {
    id: number
    user_id: string
    chat_id: number
    room_id: string
    text: string
    created_at: string
    userList: Array<{ id: string; nickname: string }>
  }
  interface Replies {
    id: number
    chat_id: number
    user_id: string
    content: string
    language: string
    code_block: string
    created_at: string
    updated_at: string
    modified_code: string
    modified_language: string
  }
  interface ReplyReactions {
    id: number
    user_id: string
    reply_id: number
    chat_id: number
    text: string
    created_at: string
    userList: Array<{ id: string; nickname: string }>
  }
  interface Mentions {
    id: number
    mention_to: string
    mention_from: string
    chat_id: number
    reply_id: number
    created_at: string
  }
  interface Opengraphs {
    id: number
    chat_id: number
    reply_id: number
    room_id: string
    title: string
    description: string
    image: string
    url: string
    site_name: string
    created_at: string
  }
  interface Saves {
    id: number
    user_id: string
    chat_id: number
    reply_id: number
    created_at: string
  }

  interface Posts {
    id: number
    title: string
    chat_ids: string
    created_at: string
    updated_at: string
    chatList?: NTable.Chats[]
  }
}

namespace NToast {
  type Type = 'success' | 'info' | 'warn' | 'error'
  interface Emit {
    message: string
    type: NToast.Type
  }
}
