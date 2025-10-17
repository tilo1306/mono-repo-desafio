export interface HealthResponse {
  status: 'ok' | 'error' | 'warning'
  info: Record<string, string>
  error: Record<string, string>
  details: Record<string, string>
}
