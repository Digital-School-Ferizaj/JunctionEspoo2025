import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  birth_year?: number;
  consent_peer?: boolean;
  consent_share?: boolean;
  interests?: string[];
}
