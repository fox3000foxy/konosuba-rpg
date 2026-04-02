export type DecodeGameplayPayloadFailureReason = 'invalid-token' | 'not-found' | 'forbidden' | 'expired' | 'stale';

export type DecodeGameplayPayloadResult = {
  payload: string | null;
  reason?: DecodeGameplayPayloadFailureReason;
};
