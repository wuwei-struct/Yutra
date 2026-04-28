# Channel Output Contract (v0.1)

type ChannelMessage = {
  channel: "taobao" | "douyin" | "wechat" | "webchat" | "generic"
  message_type: "text" | "handoff_notice" | "structured"
  text: string
  metadata?: Record<string, unknown>
}

Renderer:
- `renderResponseTemplateToChannelMessage(...)`
- File: `adapters/channel-response-adapter.mjs`

Notes:
- This pack does not send messages to real channels.
- It only standardizes output shape so channel integration can be added by customers.

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/channel-response-adapter.real.example.mjs`
- Rendering strategy:
  - template -> ChannelMessage contract
  - channel-specific sender remains customer-implemented
- This pack standardizes output shape only; it does not send to real channel SDK/API in P3-05
