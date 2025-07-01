import { SwapStatus } from "@/types/transaction";

export const friendlyMessagesByStatus = {
  [SwapStatus.NEW]: [
    "🔄 Preparing your swap",
    "📦 Initializing request",
    "🧠 Hang tight — getting everything ready",
  ],
  [SwapStatus.WAITING]: [
    "⏳ Waiting for your crypto transfer to arrive",
    "📡 Listening for your transaction on the blockchain",
    "🔍 Verifying the incoming payment",
    "🧠 The blockchain is thinking... we'll update you shortly!",
  ],
  [SwapStatus.CONFIRMING]: [
    "🧱 We are processing your transaction",
    "🔄 Confirming your transaction on-chain",
    "🧠 Almost there — just finishing up validations",
    "🔄 Still confirming everything. Thanks for your patience!",
    "🚀 Almost there! Just a little longer",
    "🤖 Working on it... your order is in progress",
  ],
  [SwapStatus.SENDING]: [
    "🚀 Sending your crypto to the destination address",
    "📤 Your assets are on their way!",
    "💨 Final step — transferring your funds",
    "🔁 Completing the swap by sending funds out",
    "📦 Wrapping up — dispatching your crypto",
  ],
  [SwapStatus.FINISHED]: [],
  [SwapStatus.REFUNDED]: [],
  [SwapStatus.FAILED]: [],
};