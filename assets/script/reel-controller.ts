import { _decorator, Button, Component, Node, SystemEventType, Tween, tween, v3 } from 'cc';
import { ReelScrollStatus, SingleReel } from './single-reel';
const { ccclass, property } = _decorator;

@ccclass('reel_controller')
export class reel_controller extends Component {
    
    index = 3 ;
    @property(Button)
    button:Button=null;
    reelList:SingleReel[]=[];
    stopCount:number = 0
    onLoad() {


        this.reelList = this.node.getComponentsInChildren(SingleReel);
        
        const delayBetweenAnimations = 300;
    
        const startScrollAnimation = () => {
      
            let arrResult=[
                [1,2,3,],
                [3,2,1,],
                [2,2,1,],
            ]
            let delay = 0;
            for (let i = 0; i < this.reelList.length; i++) {
                tween(this.reelList[i])
                    .delay(delay / 1000)
                    .call(() => {
                        this.reelList[i].reelIndex=i;
                        this.reelList[i].startScroll(30);
                        this.reelList[i].setResult(arrResult[i]);
                    })
                    .start();
                delay += delayBetweenAnimations;
            }
        };
    
        const handleTouchEnd = () => {
            startScrollAnimation();            
        };
    
        this.button.node.on(Node.EventType.TOUCH_END, () => {
            this.stopCount = 0;
            handleTouchEnd();
        }, this);
    
        this.node.on(Node.EventType.MOUSE_DOWN, () => {
            for (let i = 0; i < this.reelList.length; i++) {
                this.reelList[i].urgentStopScroll();
            }
        },this);



    }
    

    onStatusChanged(status: ReelScrollStatus,strip:number) {
         
        // 在這裡處理狀態變化
        console.log(`${strip}`,'   component status changed:', status);
        if(status === 4){
            tween(this.reelList[strip].node)
                    .by(0.1, { position: v3(0, -20, 0) })
                    .by(0.2, { position: v3(0, 20, 0) })
                    .call(()=>{
                        this.stopCount ++
                        console.log(this.stopCount)
                        if (this.stopCount === 3){
                            console.log('all stop')
                            console.log(this.reelList.length);
                            let deleteAry : number[] = [2,2,2];
                                for (let i = 0; i < deleteAry.length; i ++){
                                    this.reelList[i].deleteIndex(deleteAry[2]);
                                    console.log(i);
                                }
                        }
                    })
                    .start();
        
        }
    }

    // 記得在組件被銷毀時，移除事件監聽器
    onDestroy() {
        const childComponent = this.node.getComponent(SingleReel);
        childComponent.node.off(SingleReel.EVENT_STATUS_CHANGED, this.onStatusChanged, this);
    }
    
    
    start() {
        for(let i=0;i<this.reelList.length;i++){
            this.reelList[i].node.on(SingleReel.EVENT_STATUS_CHANGED,this.onStatusChanged,this);
        }
    }

    update(deltaTime: number) {
        
    }
}

