import { SwapStatus } from "@/types/transaction";

export const terminalStatuses = [
  SwapStatus.FINISHED,
  SwapStatus.FAILED,
  SwapStatus.REFUNDED,
];

export   const sellTerminalStatuses = ["completed", "failed", "expired"]