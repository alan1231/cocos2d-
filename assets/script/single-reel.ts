import { _decorator, Component, instantiate, Event, Node, randomRangeInt, resources, Sprite, SpriteFrame, Tween, tween, v3, Vec3, log, sp } from 'cc';



const { ccclass, property } = _decorator;
export enum ReelScrollStatus {
    NONE,
    RUN,
    GET_DATA,
    STOP,
    FINISH,
    CHANGE_SYMBOL
}
@ccclass('SingleReel')
export class SingleReel extends Component {
    @property
    slotHeight: number = 100;

    @property
    scrollDuration: number = 0.1;

    origNalPosition: Vec3[] = [];

    symbolList: Node[] = [];

    childCount: number = 0;

    reelIndex: number = 0;

    run: number = 0;

    data: number[] = [];

    symbolSpriteFrames: SpriteFrame[] = [];

    private showRellStatus: ReelScrollStatus = ReelScrollStatus.NONE;

    betweenAnimations = 0.1;

    MAX_RUN_COUNT = 4;

    static readonly EVENT_STATUS_CHANGED = 'statusChanged';

    get status(): ReelScrollStatus {
        return this.showRellStatus;
    }

    set status(value: ReelScrollStatus) {
        this.showRellStatus = value;
        this.node.emit(SingleReel.EVENT_STATUS_CHANGED,this.showRellStatus,this.reelIndex);
    }

    onLoad(): void {
        const loadurl = 'spine/symbol'; // 相對於 "assets" 文件夾的路徑
        resources.loadDir(loadurl, SpriteFrame, (err, newSymbolSpriteFrame) => {
            if (err) {
                console.error("Error loading new symbol image:", err);
                return;
            }
            this.symbolSpriteFrames = newSymbolSpriteFrame;
        });




        this.childCount = this.node.children.length;
        for (let i = 0; i < this.childCount; i++) {
            this.symbolList.push(this.node.children[i]);
            this.origNalPosition.push(this.node.children[i].getPosition());
        }

        this.status=ReelScrollStatus.FINISH;

    }

    stopScroll() {
        this.status = ReelScrollStatus.STOP;
    }

    urgentStopScroll(){
        this.run = 6;
    }

    startScroll(run:number) {
        if(this.status==ReelScrollStatus.FINISH){
            this.status = ReelScrollStatus.RUN;
            this.run = run;
            this.loopTween();
        }
    }

    setResult(data: number[]) {
        this.data = data.slice();
        this.status = ReelScrollStatus.GET_DATA;
    }

    deleteIndex(index:number){
        let symoblNode=this.symbolList[index];
        let spriteSymbolNode = symoblNode.getChildByName("staticSymbol");
        spriteSymbolNode.active = false;

        let animeNode = symoblNode.getChildByName("anime");
        let anime = animeNode.getComponent(sp.Skeleton);
        animeNode.active = true;
        anime.setCompleteListener(()=>{
            console.log('anime has completed');
            animeNode.active = false;

            let nweSymbolNode = instantiate(this.symbolList[0]);
            let newSprite=nweSymbolNode.getChildByName("staticSymbol").getComponent(Sprite);
            newSprite.spriteFrame=this.symbolSpriteFrames[5];
            this.symbolList.splice(index,1);
            symoblNode.removeFromParent();
            symoblNode=null;
            nweSymbolNode.position=this.symbolList[0].position.add(v3(0,this.slotHeight,0));
            this.symbolList.splice(1,0,nweSymbolNode);
            nweSymbolNode.parent=this.node;
            this.startDrop();
        })
        anime.setAnimation(0, 'out', false);
    }

    startDrop(){
        for(let i=0;i<this.symbolList.length;i++){
            tween(this.symbolList[i]).to(0.2,{
                position:this.origNalPosition[i]
            }).start();
        }
    }

    loopTween() {
        for (let i = 0; i < this.childCount; i++) {
            const slot = this.node.children[i];
            tween(slot)
                .by(this.betweenAnimations, { position: v3(0, -this.slotHeight, 0) })
                .call(() => {
                    if (i == (this.childCount - 1)) {
                        this.changeSymbol();
                        if (this.status == ReelScrollStatus.GET_DATA) {
                            this.normalTween();
                        } else {
                            this.loopTween();
                        }

                    }
                })
                .start()
        }
    }


    normalTween() {

        for (let i = 0; i < this.childCount; i++) {
            const slot = this.node.children[i];
            tween(slot)
                .by(this.betweenAnimations, { position: v3(0, -this.slotHeight, 0) })
                .call(() => {
                    if (i == (this.childCount - 1)) {
                        this.changeSymbol();
                        this.run--
                        if (this.run === this.MAX_RUN_COUNT || this.status == ReelScrollStatus.STOP) {
                            this.status = ReelScrollStatus.STOP
                            this.endTween();
                        } else {
                            this.normalTween();
                        }

                    }
                })
                .start();
        }
    }

    endTween() {
        for (let i = 0; i < this.childCount; i++) {
            const slot = this.node.children[i];
            tween(slot)
                .by(this.betweenAnimations, { position: v3(0, -this.slotHeight, 0) })
                .call(() => {
                    if (i == (this.childCount - 1)) {
                        this.changeRealSymbol();
                        this.run--
                        if (this.run == 0 ) {
                            this.status = ReelScrollStatus.FINISH;
                        } else {
                            this.endTween();
                        }
                    }
                })
                .start()
        }
      
        

    }

 

    private changeSymbolHelper(symoblNode: Node, symbolId?: number) {
        this.symbolList.unshift(symoblNode);
        let disCardSymbol = this.symbolList.pop();
        for (let i = 0; i < this.symbolList.length; i++) {
            let symbol = this.symbolList[i];
            symbol.setPosition(this.origNalPosition[i]);
        }
        let spriteSymbolNode = symoblNode.getChildByName("staticSymbol");
        if (symbolId === undefined) {
            symbolId = randomRangeInt(0, this.symbolSpriteFrames.length);
        }
        spriteSymbolNode.getComponent(Sprite).spriteFrame = this.symbolSpriteFrames[symbolId];
        this.node.removeChild(disCardSymbol);
        this.node.addChild(symoblNode);
    }
    
    private changeSymbol() {
        let symoblNode = instantiate(this.symbolList[this.symbolList.length - 1]);
        this.changeSymbolHelper(symoblNode);
    }
    
    private changeRealSymbol() {
        let symoblNode = instantiate(this.symbolList[this.symbolList.length - 1]);
        let symbolId = this.data.pop();
        this.changeSymbolHelper(symoblNode, symbolId);
    }

    
    
}
