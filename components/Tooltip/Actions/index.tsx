import type { FC } from 'react'

import AddReactionTooltipAction from './AddReaction'
import DeleteTooltipAction from './Delete'
import SaveTooltipAction from './Save'
import ThreadTooltipAction from './Thread'
import UpdateTooltipAction from './Update'

export interface Props {}
interface State {}

const TooltipActions: FC<Props> = () => <></>

export default Object.assign(TooltipActions, {
  AddReaction: AddReactionTooltipAction,
  Update: UpdateTooltipAction,
  Thread: ThreadTooltipAction,
  Delete: DeleteTooltipAction,
  Save: SaveTooltipAction
})
