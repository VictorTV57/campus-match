export const SWIPE_ACTIONS = ['like', 'pass', 'superlike'] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

export function isSwipeAction(value: string): value is SwipeAction {
  return (SWIPE_ACTIONS as readonly string[]).includes(value);
}

export interface SwipeResponse {
  universityId: string;
  action: SwipeAction;
  createdAt: Date;
}
