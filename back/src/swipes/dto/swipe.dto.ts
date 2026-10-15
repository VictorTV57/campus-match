import { IsIn } from 'class-validator';
import { SWIPE_ACTIONS, type SwipeAction } from '../swipes.types';

/** Corps de PUT /swipes/:universityId. */
export class SwipeDto {
  @IsIn(SWIPE_ACTIONS, {
    message: `action doit valoir ${SWIPE_ACTIONS.join(' | ')}`,
  })
  action!: SwipeAction;
}
