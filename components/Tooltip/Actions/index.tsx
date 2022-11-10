import AddReactionTooltipAction from './AddReaction'
import DeleteTooltipAction from './Delete'
import SaveTooltipAction from './Save'
import ThreadTooltipAction from './Thread'
import UpdateTooltipAction from './Update'

export default Object.assign(() => <></>, {
  AddReaction: AddReactionTooltipAction,
  Update: UpdateTooltipAction,
  Thread: ThreadTooltipAction,
  Delete: DeleteTooltipAction,
  Save: SaveTooltipAction
})
