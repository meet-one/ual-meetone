import {
  Chain,
  SignTransactionConfig,
  SignTransactionResponse,
  UALErrorType,
  User
} from 'universal-authenticator-library'

import { Wallet } from './interfaces'
import { UALMeetOneError } from './UALMeetOneError'

import MeetBridge from 'meet-bridge'
const mt = new MeetBridge()

export class MeetOneUser extends User {
  private wallet: Wallet
  private keys: string[] = []
  private chainId = ''

  constructor(
    chain: Chain | null,
    wallet: Wallet
  ) {
    super()
    this.wallet = wallet

    if (chain && chain.chainId) {
      this.chainId = chain.chainId
    }
  }

  public async signTransaction(
    transaction: any,
    config: SignTransactionConfig
  ): Promise<SignTransactionResponse> {
    try {
      // @ts-ignore
      const res = await mt.invokeTransaction({
        ...transaction,
        // @ts-ignore
        options: config
      })

      if (res.code === 0) {
        return {
          wasBroadcast: true,
          transactionId: res.data.transaction_id,
          transaction,
        }
      } else {
        throw new Error('No result returned')
      }
    } catch (e) {
      console.log(e)
      throw new UALMeetOneError(
        'Unable to sign the given transaction',
        UALErrorType.Signing,
        e)
    }
  }

  public async signArbitrary(
    publicKey: string,
    data: string,
    // tslint:disable-next-line:variable-name
    _helpText: string
    ): Promise<string> {

    try {
      // @ts-ignore
      const res = await mt.invokeSignature({ whatfor: 'Universal Authenticator', data, publicKey, isArbitrary: true })
      if (res.code === 0) {
        return res.data.signature
      } else {
        throw new Error('No result returned')
      }
    } catch (e) {
      throw new UALMeetOneError(
        'Unable to sign arbitrary string',
        UALErrorType.Signing,
        e
      )
    }
  }

  public async verifyKeyOwnership(_: string): Promise<boolean> {
    throw new Error('MeetOne does not currently support verifyKeyOwnership')
  }

  public async getAccountName(): Promise<string> {
    return this.wallet.name
  }

  public async getChainId(): Promise<string> {
    return this.chainId
  }

  public async getKeys(): Promise<string[]> {
    if (this.keys.length === 0) {
      this.keys.push(this.wallet.address)
    }

    return this.keys
  }
}
