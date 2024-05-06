import { QNotifyAction, QVueGlobals } from "quasar"
import util from "@/modules/util"

type Action = {
  icon: string
  handler: (() => void)
}
class NotifyUtil {
  private q: QVueGlobals

  constructor(qVueGlobals: QVueGlobals){
    this.q = qVueGlobals;
  }

  notify(message:string, actions?:Action[], isNegative?:boolean){
    const color = isNegative ? "negative" : 
                    util.isDarkMode() ? "dark" : "pink-2";
    const textColor = isNegative || util.isDarkMode() ? "white" : "black"
    const allActions:QNotifyAction[] = [];
    actions?.forEach(action => {
      allActions.push({
        ...action, color: textColor, round: true
      })
    });
    // closeアクションは固定で出す
    allActions.push({icon:"close", color: textColor, round: true, handler: () => {}})
  
    this.q.notify({
      message,
      color,
      textColor,
      actions: allActions
    });

  }
}


export{
  NotifyUtil
}