interface ReactProps {
  children?: ReactNode
}

type TPosition = 'left' | 'top' | 'right' | 'bottom'

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
  position?: TPosition
}

type R = Database['public']['Tables']['reactions']['Row']
type RR = Database['public']['Tables']['reply_reactions']['Row']

namespace NTable {
  type Users = Database['public']['Tables']['users']['Row']
  type Rooms = Database['public']['Tables']['rooms']['Row']
  type Chats = Database['public']['Tables']['chats']['Row']
  type Languages = Database['public']['Tables']['languages']['Row']
  interface Reactions extends R {
    userList: Array<{ id: string; reactionId: number; nickname: string }>
  }
  type Replies = Database['public']['Tables']['replies']['Row']
  interface ReplyReactions extends RR {
    userList: Array<{ id: string; reactionId: number; nickname: string }>
  }
  type Mentions = Database['public']['Tables']['mentions']['Row']
  type Opengraphs = Database['public']['Tables']['opengraphs']['Row']
  type Saves = Database['public']['Tables']['saves']['Row']
}

namespace NToast {
  type Type = 'success' | 'info' | 'warn' | 'error'
  interface Emit {
    message: string
    type: NToast.Type
  }
}

interface TooltipProps {
  position?: TPosition
}

interface Database {
  public: {
    Tables: {
      mentions: {
        Row: {
          id: number
          mention_to: string
          mention_from: string
          chat_id: number
          reply_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          mention_to: string
          mention_from: string
          chat_id: number
          reply_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          mention_to?: string
          mention_from?: string
          chat_id?: number
          reply_id?: number | null
          created_at?: string
        }
      }
      opengraphs: {
        Row: {
          id: number
          chat_id: number | null
          reply_id: number | null
          room_id: string
          title: string | null
          description: string | null
          image: string | null
          url: string | null
          site_name: string | null
          created_at: string
        }
        Insert: {
          id?: number
          chat_id?: number | null
          reply_id?: number | null
          room_id: string
          title?: string | null
          description?: string | null
          image?: string | null
          url?: string | null
          site_name?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          chat_id?: number | null
          reply_id?: number | null
          room_id?: string
          title?: string | null
          description?: string | null
          image?: string | null
          url?: string | null
          site_name?: string | null
          created_at?: string
        }
      }
      saves: {
        Row: {
          id: number
          user_id: string
          chat_id: number | null
          reply_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          chat_id?: number | null
          reply_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          chat_id?: number | null
          reply_id?: number | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          avatar_url: string | null
          job_category: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          nickname: string
          avatar_url?: string | null
          job_category?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          avatar_url?: string | null
          job_category?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          logo_url: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      chats: {
        Row: {
          id: number
          user_id: string
          room_id: string
          content: string
          code_block: string | null
          language: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          modified_code: string | null
          modified_language: string | null
        }
        Insert: {
          id?: number
          user_id: string
          room_id: string
          content: string
          code_block?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          modified_code?: string | null
          modified_language?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          room_id?: string
          content?: string
          code_block?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          modified_code?: string | null
          modified_language?: string | null
        }
      }
      languages: {
        Row: {
          id: number
          label: string
          value: string
          template: string | null
          created_at: string
        }
        Insert: {
          id?: number
          label: string
          value: string
          template?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          label?: string
          value?: string
          template?: string | null
          created_at?: string
        }
      }
      replies: {
        Row: {
          id: number
          user_id: string
          chat_id: number
          content: string
          code_block: string | null
          language: string | null
          created_at: string
          updated_at: string | null
          modified_code: string | null
          modified_language: string | null
          room_id: string | null
        }
        Insert: {
          id?: number
          user_id: string
          chat_id: number
          content: string
          code_block?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string | null
          modified_code?: string | null
          modified_language?: string | null
          room_id?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          chat_id?: number
          content?: string
          code_block?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string | null
          modified_code?: string | null
          modified_language?: string | null
          room_id?: string | null
        }
      }
      reply_reactions: {
        Row: {
          id: number
          user_id: string
          chat_id: number
          reply_id: number
          text: string
          created_at: string
          emoji: string | null
        }
        Insert: {
          id?: number
          user_id: string
          chat_id: number
          reply_id: number
          text: string
          created_at?: string
          emoji?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          chat_id?: number
          reply_id?: number
          text?: string
          created_at?: string
          emoji?: string | null
        }
      }
      reactions: {
        Row: {
          id: number
          user_id: string
          chat_id: number
          room_id: string
          emoji: string
          created_at: string
          text: string | null
        }
        Insert: {
          id?: number
          user_id: string
          chat_id: number
          room_id: string
          emoji: string
          created_at?: string
          text?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          chat_id?: number
          room_id?: string
          emoji?: string
          created_at?: string
          text?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

type TChat = NTable.Chats & {
  user: Pick<NTable.Users, 'nickname' | 'avatar_url'>
  reactions: Array<
    Pick<NTable.Reactions, 'id' | 'text' | 'emoji' | 'user_id' | 'userList'> & {
      user: Pick<NTable.Users, 'nickname'>
    }
  >
  replies: Array<
    Pick<NTable.Replies, 'id' | 'created_at'> & {
      user: Pick<NTable.Users, 'avatar_url'>
    }
  >
  opengraphs: Array<
    Pick<NTable.Opengraphs, 'id' | 'title' | 'description' | 'url' | 'image'>
  >
  saves: Array<Pick<NTable.Saves, 'id'>>
}

type TReply = NTable.Replies & {
  user: Pick<NTable.Users, 'id' | 'nickname' | 'avatar_url'>
  reply_reactions: Array<
    Pick<
      NTable.ReplyReactions,
      'id' | 'text' | 'emoji' | 'user_id' | 'userList'
    > & {
      user: Pick<NTable.Users, 'nickname'>
    }
  >
  opengraphs: Array<
    Pick<NTable.Opengraphs, 'id' | 'title' | 'description' | 'url' | 'image'>
  >
  saves: Array<Pick<NTable.Saves, 'id'>>
}
