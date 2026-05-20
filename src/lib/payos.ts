import { PayOS } from '@payos/node'

export function getPayOSClient() {
  const clientId = process.env.PAYOS_CLIENT_ID
  const apiKey = process.env.PAYOS_API_KEY
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('Missing payOS environment variables')
  }

  return new PayOS({
    clientId,
    apiKey,
    checksumKey,
  })
}

export function getPayOSReturnUrl() {
  return process.env.PAYOS_RETURN_URL || 'http://localhost:3000/account/top-up'
}

export function getPayOSCancelUrl() {
  return process.env.PAYOS_CANCEL_URL || 'http://localhost:3000/account/top-up'
}
