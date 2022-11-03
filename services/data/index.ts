export enum TOAST_MESSAGE {
  SESSION_EXPIRED = '세션이 만료되었습니다. 로그인을 다시 해주세요.',
  API_ERROR = '에러가 발생했습니다. 문제가 지속된다면 문의부탁드립니다.',
  LOGIN_REQUIRED = '로그인이 필요합니다.'
}

export const REGEXP: Record<
  'MENTION' | 'NICKNAME' | 'UUID' | 'URL' | 'EMAIL',
  RegExp
> = {
  MENTION:
    /@\[[a-zA-Z0-9]*\]\([0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}\)/g,
  NICKNAME: /\[[a-zA-Z0-9]*\]/,
  UUID: /[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/,
  URL: /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
  EMAIL: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
}
