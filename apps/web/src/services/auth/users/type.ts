export interface UsersResponse {
  data: User[]
  meta: Meta
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export interface Meta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
