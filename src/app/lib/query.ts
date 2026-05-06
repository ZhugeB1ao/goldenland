import qs from 'qs'

export const buildQuery = (query: any) =>
  qs.stringify(query, {
    addQueryPrefix: true,
    encode: false, 
  })