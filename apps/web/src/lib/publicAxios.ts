/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/lib/publicAxios.ts
import axios from 'axios';

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  headers: { 'Content-Type': 'application/json' },
});