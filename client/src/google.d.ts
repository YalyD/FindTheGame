interface CredentialResponse {
  credential: string
  select_by: string
}

interface IdConfiguration {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
}

interface GsiButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: string
  width?: number
}

interface Google {
  accounts: {
    id: {
      initialize: (config: IdConfiguration) => void
      renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void
      prompt: () => void
    }
  }
}

declare const google: Google
