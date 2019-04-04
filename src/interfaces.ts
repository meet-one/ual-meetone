export const Name: string = 'MEETONE'

export interface Wallet {
  name: string
  address: string
}

export interface PushEosActionResponse {
  result: boolean
  data: {
    transactionId: string
  }
}
