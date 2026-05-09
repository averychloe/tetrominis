// ------------------- VARIABLES---------------------
const squareSize = 30
let previewLength = 5
let firstGameStarted = false;

const showCenterOfRotationOfMovingPiece = true;
let hasDied = false;

let combo = -1;
let b2b = -1;

let DCDLastInvoked = Date.now();
let ARRLastInvoked = Date.now();

const SRSJLSTZKickTable = {
    "0toL": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    "Lto2": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    "2toR": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    "Rto0": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    "Lto0": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    "2toL": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    "Rto2": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    "0toR": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
}

const SRSIKickTable = {
    "0toL": [[0,0], [-1,0], [2,0], [2,-1], [-1,2]],
    "Lto2": [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],
    "2toR": [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],
    "Rto0": [[0,0], [1,0], [-2, 0], [1, 2], [-2, -1]],
    "Lto0": [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    "2toL": [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    "Rto2": [[0,0], [-1,0], [2, 0], [-1, 2], [2, -1]],
    "0toR": [[0,0], [1,0], [-2,0], [-2,-1], [1,2]],
}

const flipKickTable = {
    "0to2": [[0,0], [0,1], [1,1], [-1,1], [1,0], [-1,0]],
    "2to0": [[0,0], [0,-1], [-1,-1], [1,-1], [-1,0], [1,0]],
    "LtoR": [[0,0], [1,0], [1,2], [1,1], [0,2], [0,1]],
    "RtoL": [[0,0], [-1,0], [-1,2], [-1,1], [0,2], [0,1]],
}

let playerBoardState = []
let playerSquareManagers = []
let PlayerHoldManager, PlayerNextManager, PlayerCurrentPieceManager, PlayerGarbageManager;
let DASLeftTimeout, DASRightTimeout;

// HANDLING
// all variables are in milliseconds!
let ARR = 0;
let DAS = 100
let DCD = 20
const controlsPollingRate = 50; // 50 polls per second, i.e. 20ms per frame

const SFX = {
    "windup1": new Audio("garbagewindup_1.ogg"),
    "windup2": new Audio("garbagewindup_2.ogg"),
    "windup3": new Audio("garbagewindup_3.ogg"),
    "windup4": new Audio("garbagewindup_4.ogg"),
    "clearline": new Audio("clearline.ogg"),
    "clearquad": new Audio("clearquad.ogg"),
    "clearspin": new Audio("clearspin.ogg"),
    "harddrop": new Audio("harddrop.ogg"),
    "softdrop": new Audio("softdrop.ogg"),
    "spin": new Audio("spin.ogg"),
}
const Windup1SFX = new Audio("garbagewindup_1.ogg")
const Windup2SFX = new Audio("garbagewindup_2.ogg")
const Windup3SFX = new Audio("garbagewindup_3.ogg")
const Windup4SFX = new Audio("garbagewindup_4.ogg")

// CONTROLS
let controls = {
    "CCW": {"key": "a", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "CW": {"key": "d", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "ROTATE_180": {"key": "w", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "HOLD": {"key": "s", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "MOVE_LEFT": {"key": "k", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "MOVE_RIGHT": {"key": ";", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "SOFT_DROP": {"key": "o", "held": false, "heldFrom": 0, "executedInitialAction": false},
    "HARD_DROP": {"key": "l", "held": false, "heldFrom": 0, "executedInitialAction": false},
}

let totalAttackSent = 0;
let gameStartedAt = Date.now();
let totalPiecesPlaced = 0;
let totalLinesCleared = 0;
let garbageCap = 8;
let lastLineClearAt = Date.now();
let quickPlaySimulatorMode = true;
let holdIsAvailable = true;

let survivalInitialAPM = 120;
let survivalAPMIncrease = 60;
let survivalTimeBetweenAttacks = 5000;

// -------------------- ELEMENTS ---------------------
const playerBoard = document.getElementById("player-playfield")
const DOMSpinTextDisplay = document.getElementById("spin-text")
const DOMClearTextDisplay = document.getElementById("clear-text")
const DOMComboTextDisplay = document.getElementById("combo-text")
const DOMB2BTextDisplay = document.getElementById("b2b-text")
const DOMSpikeTextDisplay = document.getElementById("spike-text")
const DOMPlayerGarbageDisplay = document.getElementById("player-garbage-display")
const DOMTimeDisplay = document.getElementById("time-text")
const DOMPPSDisplay = document.getElementById("pps-text")
const DOMAPMDisplay = document.getElementById("apm-text")
const DOMAPPDisplay = document.getElementById("app-text")
const DOMVSDisplay = document.getElementById("vs-text")

// -------------------- CLASSES ---------------------
class squareManager{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.contains = "empty";
        this.DOMSquare = document.createElement("div");
        this.DOMSquare.style.bottom = `${y * squareSize}px`;
        this.DOMSquare.style.left = `${x * squareSize}px`;
        this.DOMSquare.style.position = "absolute";
        playerBoard.appendChild(this.DOMSquare);
        this.refresh()
    }

    refresh(){
        switch(this.contains){
            case "empty":
                this.DOMSquare.className = this.y < 20 ? "empty square" : "notshown noborder square";
                break;
            case "t":
                this.DOMSquare.className = "t square";
                break;
            case "s":
                this.DOMSquare.className = "s square";
                break;  
            case "z":
                this.DOMSquare.className = "z square";
                break;  
            case "o":
                this.DOMSquare.className = "o square";
                break;  
            case "i":
                this.DOMSquare.className = "i square";
                break;  
            case "j":
                this.DOMSquare.className = "j square";
                break;  
            case "l":
                this.DOMSquare.className = "l square";
                break;  
            case "garbage":
                this.DOMSquare.className = "garbage square";
                break;      
            default:
                this.DOMSquare.className = this.y < 20 ? "empty square" : "notshown noborder square";
                break;            
        }
    }

    setContents(type){
        this.contains = type;
        this.refresh();
    }

    getContents(){
        return this.contains
    }
}

class playerHoldManager{
    constructor(){
        document.getElementById("player-hold").innerHTML = "";
        this.piece = "empty"
        this.DOMHoldPieceContainer = document.createElement("div");
        this.DOMHoldPieceContainer.style.position = "relative";
        document.getElementById("player-hold").appendChild(this.DOMHoldPieceContainer);
    }

    reset(){
        document.getElementById("player-hold").innerHTML = "";
        this.piece = "empty"
        this.DOMHoldPieceContainer = document.createElement("div");
        this.DOMHoldPieceContainer.style.position = "relative";
        document.getElementById("player-hold").appendChild(this.DOMHoldPieceContainer);
    }

    addSquareToHold(type, x, y){
        let newSquare = document.createElement("div");
        newSquare.style.position = "absolute";
        newSquare.style.bottom = `${y * squareSize}px`;
        newSquare.style.left = `${x * squareSize}px`;
        // newSquare.style.transform = "scale(103%)"
        newSquare.className = `${type} square noborder`
        this.DOMHoldPieceContainer.appendChild(newSquare);
    }

    clearHold(){
        this.DOMHoldPieceContainer.innerHTML = "";
    }

    hold(piece){
        this.clearHold();
        this.piece = piece;
        switch(piece){
            case "t":
                this.addSquareToHold("t", -3/2, -1)
                this.addSquareToHold("t", -1/2, -1)
                this.addSquareToHold("t", 1/2, -1)
                this.addSquareToHold("t", -1/2, 0)
                break;
            case "s":
                this.addSquareToHold("s", -3/2, -1)
                this.addSquareToHold("s", -1/2, -1)
                this.addSquareToHold("s", -1/2, 0)
                this.addSquareToHold("s", 1/2, 0)
                break;  
            case "z":
                this.addSquareToHold("z", -3/2, 0)
                this.addSquareToHold("z", -1/2, 0)
                this.addSquareToHold("z", -1/2, -1)
                this.addSquareToHold("z", 1/2, -1)
                break;  
            case "o":
                this.addSquareToHold("o", -1, -1)
                this.addSquareToHold("o", 0, -1)
                this.addSquareToHold("o", -1, 0)
                this.addSquareToHold("o", 0, 0)
                break;  
            case "i":
                this.addSquareToHold("i", -2, -1/2)
                this.addSquareToHold("i", -1, -1/2)
                this.addSquareToHold("i", 0, -1/2)
                this.addSquareToHold("i", 1, -1/2)
                break;  
            case "j":
                this.addSquareToHold("j", -3/2, -1)
                this.addSquareToHold("j", -1/2, -1)
                this.addSquareToHold("j", 1/2, -1)
                this.addSquareToHold("j", -3/2, 0)
                break;  
            case "l":
                this.addSquareToHold("l", -3/2, -1)
                this.addSquareToHold("l", -1/2, -1)
                this.addSquareToHold("l", 1/2, -1)
                this.addSquareToHold("l", 1/2, 0)
                break;  
            default:
                alert(`did you know? ${piece} is not a real tetris piece`)
        }
    }

    getHoldPiece(){
        return this.piece
    }
}

class playerNextManager{
    constructor(){
        document.getElementById("player-next").innerHTML = "";
        let pieceContainers = []
        let containerContents = []
        for(let i = 0; i < previewLength; i++){
            let newPieceContainer = document.createElement("div");
            newPieceContainer.className = "piece-container"
            newPieceContainer.style.position = "relative";
            //lazy fix below, beware
            newPieceContainer.style.transform = "translate(50%, -50%)";
            document.getElementById("player-next").appendChild(newPieceContainer)
            pieceContainers.push(newPieceContainer)
            containerContents.push("")
        }
        this.pieceContainers = pieceContainers;
        this.containerContents = containerContents;
        this.bag = generateBag();
        this.piecesUntilEndOfBag = 7-previewLength;
        this.displayInitialQueue();
    }

    reset(){
        document.getElementById("player-next").innerHTML = "";
        let pieceContainers = []
        let containerContents = []
        for(let i = 0; i < previewLength; i++){
            let newPieceContainer = document.createElement("div");
            newPieceContainer.className = "piece-container"
            newPieceContainer.style.position = "relative";
            //lazy fix below, beware
            newPieceContainer.style.transform = "translate(50%, -50%)";
            document.getElementById("player-next").appendChild(newPieceContainer)
            pieceContainers.push(newPieceContainer)
            containerContents.push("")
        }
        this.pieceContainers = pieceContainers;
        this.containerContents = containerContents;
        this.bag = generateBag();
        this.piecesUntilEndOfBag = 7-previewLength;
        this.displayInitialQueue();
    }

    addSquareToContainer(pieceContainer, type, x, y){
        let newSquare = document.createElement("div");
        newSquare.style.position = "absolute";
        newSquare.style.bottom = `${y * squareSize}px`;
        newSquare.style.left = `${x * squareSize}px`;
        // newSquare.style.transform = "scale(103%)"
        newSquare.className = `${type} square noborder`
        pieceContainer.appendChild(newSquare);
    }

    clearContainer(pieceContainer){
        pieceContainer.innerHTML = "";
    }

    // like i could definitely use a refactor that puts coordinates for each square in a piece in a list or something. instead of hardcoding them. but unless i'm gonna add pentominoes this should be fine
    putPieceInContainer(pieceContainer, piece){
        this.clearContainer(pieceContainer)
        switch(piece){
            case "t":
                this.addSquareToContainer(pieceContainer, "t", -3/2, -1)
                this.addSquareToContainer(pieceContainer, "t", -1/2, -1)
                this.addSquareToContainer(pieceContainer, "t", 1/2, -1)
                this.addSquareToContainer(pieceContainer, "t", -1/2, 0)
                break;
            case "s":
                this.addSquareToContainer(pieceContainer, "s", -3/2, -1)
                this.addSquareToContainer(pieceContainer, "s", -1/2, -1)
                this.addSquareToContainer(pieceContainer, "s", -1/2, 0)
                this.addSquareToContainer(pieceContainer, "s", 1/2, 0)
                break;  
            case "z":
                this.addSquareToContainer(pieceContainer, "z", -3/2, 0)
                this.addSquareToContainer(pieceContainer, "z", -1/2, 0)
                this.addSquareToContainer(pieceContainer, "z", -1/2, -1)
                this.addSquareToContainer(pieceContainer, "z", 1/2, -1)
                break;  
            case "o":
                this.addSquareToContainer(pieceContainer, "o", -1, -1)
                this.addSquareToContainer(pieceContainer, "o", 0, -1)
                this.addSquareToContainer(pieceContainer, "o", -1, 0)
                this.addSquareToContainer(pieceContainer, "o", 0, 0)
                break;  
            case "i":
                this.addSquareToContainer(pieceContainer, "i", -2, -1/2)
                this.addSquareToContainer(pieceContainer, "i", -1, -1/2)
                this.addSquareToContainer(pieceContainer, "i", 0, -1/2)
                this.addSquareToContainer(pieceContainer, "i", 1, -1/2)
                break;  
            case "j":
                this.addSquareToContainer(pieceContainer, "j", -3/2, -1)
                this.addSquareToContainer(pieceContainer, "j", -1/2, -1)
                this.addSquareToContainer(pieceContainer, "j", 1/2, -1)
                this.addSquareToContainer(pieceContainer, "j", -3/2, 0)
                break;  
            case "l":
                this.addSquareToContainer(pieceContainer, "l", -3/2, -1)
                this.addSquareToContainer(pieceContainer, "l", -1/2, -1)
                this.addSquareToContainer(pieceContainer, "l", 1/2, -1)
                this.addSquareToContainer(pieceContainer, "l", 1/2, 0)
                break;  
            default:
                alert(`did you know? ${piece} is not a valid tetris piece!`)
        }
    }

    displayInitialQueue(){
        for(let i = 0; i < previewLength; i++){
            this.putPieceInContainer(
                this.pieceContainers[i], 
                this.bag[i]
            );
            this.containerContents[i] = this.bag[i];
        }
    }

    advanceQueue(){
        const piecePushedOut = this.containerContents[0]
        if(this.piecesUntilEndOfBag==0){
            this.bag=generateBag()
            this.piecesUntilEndOfBag=7;
        }
        for(let i = 0; i < previewLength-1; i++){
            this.putPieceInContainer(
                this.pieceContainers[i], 
                this.containerContents[i+1]
            );
            this.containerContents[i] = this.containerContents[i+1];
        }
        this.putPieceInContainer(this.pieceContainers[previewLength-1], this.bag[7-this.piecesUntilEndOfBag]);
        this.containerContents[previewLength-1] = this.bag[7-this.piecesUntilEndOfBag]
        this.piecesUntilEndOfBag--;

        return piecePushedOut
    }
}

class currentPieceManager{
    constructor(){
        this.squareCoordinates = [];
        this.DOMSquares = [];
        this.DOMGhost = [];
        this.centerOfRotation = [];
        this.piece = "";
        this.centerOfRotationDOM = "";
        this.TSTKickUsed = false;
        this.currentRotationState = 0; // how many counterclockwise rotations have been applied. this is relevant for srs kicks.
        this.lastMoveWasRotation = false;
    }

    reset(){
        this.squareCoordinates = [];
        this.DOMSquares = [];
        this.DOMGhost = [];
        this.centerOfRotation = [];
        this.piece = "";
        this.centerOfRotationDOM = "";
        this.TSTKickUsed = false;
        this.currentRotationState = 0; // how many counterclockwise rotations have been applied. this is relevant for srs kicks.
        this.lastMoveWasRotation = false;
        this.pullFromQueue();
    }

    getCurrentPiece(){
        return this.piece;
    }

    startPlacingPiece(piece){
        this.piece = piece;
        this.TSTKickUsed = false;
        this.currentRotationState = 0;
        switch(piece){
            case "i":
                this.squareCoordinates = [[3, 21], [4, 21], [5, 21], [6, 21]]
                this.centerOfRotation = [4.5, 20.5]
                break;
            case "j":
                this.squareCoordinates = [[3, 21], [4, 21], [5, 21], [3, 22]]
                this.centerOfRotation = [4, 21]
                break;
            case "o":
                this.squareCoordinates = [[4, 22], [4, 21], [5, 21], [5, 22]]
                this.centerOfRotation = [4.5, 21.5]
                break;
            case "l":
                this.squareCoordinates = [[3, 21], [4, 21], [5, 21], [5, 22]]
                this.centerOfRotation = [4, 21]
                break;
            case "s":
                this.squareCoordinates = [[3, 21], [4, 21], [4, 22], [5, 22]]
                this.centerOfRotation = [4, 21]
                break;
            case "t":
                this.squareCoordinates = [[3, 21], [4, 21], [5, 21], [4, 22]]
                this.centerOfRotation = [4, 21]
                break;
            case "z":
                this.squareCoordinates = [[5, 21], [4, 21], [4, 22], [3, 22]]
                this.centerOfRotation = [4, 21]
                break;
            default:
                alert(`did you know? ${piece} is not a valid tetris piece!`)
                break;
        }
        this.render();
    }

    renderPiece(){
        if(this.DOMSquares.length == 0){
            for(let i = 0; i < 4; i++){
                let newSquare = document.createElement("div");
                newSquare.style.bottom = `${this.squareCoordinates[i][1] * squareSize}px`;
                newSquare.style.left = `${this.squareCoordinates[i][0] * squareSize}px`;
                newSquare.style.position = "absolute";
                newSquare.className = `${this.piece} square`
                this.DOMSquares.push(newSquare)
                playerBoard.appendChild(newSquare);
            }
        }
        else{
            for(let i = 0; i < 4; i++){
                this.DOMSquares[i].style.bottom = `${this.squareCoordinates[i][1] * squareSize}px`;
                this.DOMSquares[i].style.left = `${this.squareCoordinates[i][0] * squareSize}px`;
                this.DOMSquares[i].style.position = "absolute";
                this.DOMSquares[i].className = `${this.piece} square`
                if(playerBoardState[this.squareCoordinates[i][1]][this.squareCoordinates[i][0]] != ""){
                    lose()
                }
            }
        }
    }

    checkVisibility(direction){
        let visibility = 0;
        let squaresCurrentlyBeingChecked = this.squareCoordinates.slice()
        switch(direction){
            case "up":
                while(true){
                    visibility++;
                    for(let i = 0; i < 4; i++){
                        if(squaresCurrentlyBeingChecked[i][1] + visibility > 29){
                            return visibility-1;
                        }
                        if(isCellObstructed(squaresCurrentlyBeingChecked[i][0], squaresCurrentlyBeingChecked[i][1]+visibility)){
                            return visibility-1;
                        }
                    }
                }
                break;
            case "down":
                while(true){
                    visibility++;
                    for(let i = 0; i < 4; i++){
                        if(squaresCurrentlyBeingChecked[i][1] - visibility < 0){
                            return visibility-1;
                        }
                        if(isCellObstructed(squaresCurrentlyBeingChecked[i][0], squaresCurrentlyBeingChecked[i][1]-visibility)){
                            return visibility-1;
                        }
                    }
                }
                break;
            case "left":
                while(true){
                    visibility++;
                    for(let i = 0; i < 4; i++){
                        if(squaresCurrentlyBeingChecked[i][0] - visibility < 0){
                            return visibility-1;
                        }
                        if(isCellObstructed(squaresCurrentlyBeingChecked[i][0]-visibility, squaresCurrentlyBeingChecked[i][1])){
                            return visibility-1;
                        }
                    }
                }
                break;
            case "right":
                while(true){
                    visibility++;
                    for(let i = 0; i < 4; i++){
                        if(squaresCurrentlyBeingChecked[i][0] + visibility > 9){
                            return visibility-1;
                        }
                        if(isCellObstructed(squaresCurrentlyBeingChecked[i][0]+visibility, squaresCurrentlyBeingChecked[i][1])){
                            return visibility-1;
                        }
                    }
                }
                break;
            default:
                alert(`did you know that you're supposed to provide a direction for this function? ${direction} is not a valid direction.`)
                break;
        }
    }

    checkImmobility(){
        return (this.checkVisibility("left")==0)&&(this.checkVisibility("right")==0)&&(this.checkVisibility("up")==0)&&(this.checkVisibility("down")==0)
    }

    renderGhost(){
        const downVisibility = this.checkVisibility("down")
        if(this.DOMGhost.length == 0){
            for(let i = 0; i < 4; i++){
                let newSquare = document.createElement("div");
                newSquare.style.bottom = `${(this.squareCoordinates[i][1]-downVisibility) * squareSize}px`;
                newSquare.style.left = `${this.squareCoordinates[i][0] * squareSize}px`;
                newSquare.style.position = "absolute";
                newSquare.className = `ghost square`
                this.DOMGhost.push(newSquare)
                playerBoard.appendChild(newSquare);
            }
        }
        else{
            for(let i = 0; i < 4; i++){
                this.DOMGhost[i].style.bottom = `${(this.squareCoordinates[i][1]-downVisibility) * squareSize}px`;
                this.DOMGhost[i].style.left = `${this.squareCoordinates[i][0] * squareSize}px`;
                this.DOMGhost[i].style.position = "absolute";
            }
        }
    }

    renderCenterOfRotation(){
        if(this.centerOfRotationDOM == ""){
            this.centerOfRotationDOM = document.createElement("div")
            this.centerOfRotationDOM.position = "absolute";
            this.centerOfRotationDOM.className = "center-of-rotation";
            playerBoard.appendChild(this.centerOfRotationDOM)
        }
        this.centerOfRotationDOM.style.left = `${(this.centerOfRotation[0]+1/2)*squareSize}px`;
        this.centerOfRotationDOM.style.bottom = `${(this.centerOfRotation[1]+1/2)*squareSize}px`;
    }

    render(){
        this.renderPiece();
        this.renderGhost();
        if(showCenterOfRotationOfMovingPiece){
            this.renderCenterOfRotation();
        }
    }

    tryToMoveLeft(){
        if(this.checkVisibility("left")>0){
            for(let i = 0; i < 4; i++){
                this.squareCoordinates[i][0]--;
            }
            this.centerOfRotation[0]-=1;
            this.lastMoveWasRotation = false;
            this.render();
        }   
    }

    tryToMoveRight(){
        if(this.checkVisibility("right")>0){
            for(let i = 0; i < 4; i++){
                this.squareCoordinates[i][0]++;
            }
            this.centerOfRotation[0]+=1;
            this.lastMoveWasRotation = false;
            this.render();
        }
    }

    DASLeft(){
        const leftVisibility = this.checkVisibility("left");
        this.centerOfRotation[0] -= leftVisibility;
        for(let i = 0; i < 4; i++){
            this.squareCoordinates[i][0]-=leftVisibility;
        }
        if(leftVisibility>0){
            this.lastMoveWasRotation = false;
        }
        this.render();
    }

    DASRight(){
        const rightVisibility = this.checkVisibility("right");
        this.centerOfRotation[0] += rightVisibility;
        for(let i = 0; i < 4; i++){
            this.squareCoordinates[i][0]+=rightVisibility;
        }
        if(rightVisibility>0){
            this.lastMoveWasRotation = false;
        }
        this.render();
    }

    // https://harddrop.com/wiki/SRS the kick tables are taken from here
    tryRotation(offsetX, offsetY, CCWAngle){
        let positionsAfterRotation = [];
        for(let i = 0; i < 4; i++){
            let rotatedPoint = rotatePointAroundCenter(this.squareCoordinates[i], this.centerOfRotation, CCWAngle)
            let rotatedAndOffsetPoint = [rotatedPoint[0] + offsetX, rotatedPoint[1]+offsetY]
            positionsAfterRotation.push(rotatedAndOffsetPoint)
        }
        
        let isObstructed = false;
        let obstructionPosition;
        for(let i = 0; i < 4; i++){
            if(isCellObstructed(positionsAfterRotation[i])){
                obstructionPosition = positionsAfterRotation[i];
                isObstructed = true;
            }
        }

        if(!isObstructed){
            this.squareCoordinates = positionsAfterRotation;
            this.centerOfRotation = [this.centerOfRotation[0]+offsetX, this.centerOfRotation[1]+offsetY]
            this.currentRotationState += CCWAngle/90;
            this.lastMoveWasRotation=true;
            this.render();

            return true
        }
        return false
    }

    tryRotationTests(tests, CCWAngle){ // tests is an array of pairs [x,y] of offset coordinates.
        for (let i = 0; i < tests.length; i++){
            const test = tests[i];
            if(this.tryRotation(test[0], test[1], CCWAngle)){
                if(this.piece == "t" && CCWAngle != 180 && i == 4){
                    this.TSTKickUsed = true;
                }
                return;
            }
        }
    }

    rotateCCW(){
        if(this.piece == "o"){
            return; // well technically this isn't necessary, but it's here anyway for readability
        }

        if(this.piece != "i"){
            // j/l/s/t/z kicks
            switch(this.currentRotationState % 4){
                case 0:
                    //0->L, recall: this.currentRotationState stores the number of counterclockwise turns made
                    this.tryRotationTests(SRSJLSTZKickTable["0toL"], 90)
                    break;
                case 1:
                    //L->2
                    this.tryRotationTests(SRSJLSTZKickTable["Lto2"], 90)
                    break;
                case 2:
                    //2->R
                    this.tryRotationTests(SRSJLSTZKickTable["2toR"], 90)
                    break;
                case 3:
                    //R->0
                    this.tryRotationTests(SRSJLSTZKickTable["Rto0"], 90)
                    break;
            }
        }
        else{
            switch(this.currentRotationState % 4){
                case 0:
                    //0->L, recall: this.currentRotationState stores the number of counterclockwise turns made
                    this.tryRotationTests(SRSIKickTable["0toL"], 90)
                    break;
                case 1:
                    //L->2
                    this.tryRotationTests(SRSIKickTable["Lto2"], 90)
                    break;
                case 2:
                    //2->R
                    this.tryRotationTests(SRSIKickTable["2toR"], 90)
                    break;
                case 3:
                    //R->0
                    this.tryRotationTests(SRSIKickTable["Rto0"], 90)
                    break;
            }
        }

        DCDLastInvoked = Date.now();
    }

    rotateCW(){
        if(this.piece == "o"){
            return; // well technically this isn't necessary, but it's here anyway for readability
        }

        if(this.piece != "i"){
            // j/l/s/t/z kicks
            switch(this.currentRotationState % 4){
                case 0:
                    //0->L, recall: this.currentRotationState stores the number of counterclockwise turns made
                    this.tryRotationTests(SRSJLSTZKickTable["0toR"], 270)
                    break;
                case 1:
                    //L->2
                    this.tryRotationTests(SRSJLSTZKickTable["Lto0"], 270)
                    break;
                case 2:
                    //2->R
                    this.tryRotationTests(SRSJLSTZKickTable["2toL"], 270)
                    break;
                case 3:
                    //R->0
                    this.tryRotationTests(SRSJLSTZKickTable["Rto2"], 270)
                    break;
            }
        }
        else{
            switch(this.currentRotationState % 4){
                case 0:
                    //0->L, recall: this.currentRotationState stores the number of counterclockwise turns made
                    this.tryRotationTests(SRSIKickTable["0toR"], 270)
                    break;
                case 1:
                    //L->2
                    this.tryRotationTests(SRSIKickTable["Lto0"], 270)
                    break;
                case 2:
                    //2->R
                    this.tryRotationTests(SRSIKickTable["2toL"], 270)
                    break;
                case 3:
                    //R->0
                    this.tryRotationTests(SRSIKickTable["Rto2"], 270)
                    break;
            }
        }

        DCDLastInvoked = Date.now();
    }

    rotate180(){
        if(this.piece == "o"){
            return; // well technically this isn't necessary, but it's here anyway for readability
        }
        switch(this.currentRotationState % 4){
            case 0:
                //0->L, recall: this.currentRotationState stores the number of counterclockwise turns made
                this.tryRotationTests(flipKickTable["0to2"], 180)
                break;
            case 1:
                //L->2
                this.tryRotationTests(flipKickTable["LtoR"], 180)
                break;
            case 2:
                //2->R
                this.tryRotationTests(flipKickTable["2to0"], 180)
                break;
            case 3:
                //R->0
                this.tryRotationTests(flipKickTable["RtoL"], 180)
                break;
        }

        DCDLastInvoked = Date.now();
    }

    softDrop(){
        // implementation for infinite SDF, finite SDF not yet supported. gravity isn't even supported either.
        const downVisibility = this.checkVisibility("down");
        this.centerOfRotation[1] -= downVisibility;
        for(let i = 0; i < 4; i++){
            this.squareCoordinates[i][1]-=downVisibility;
        }
        if(downVisibility>0){
            this.lastMoveWasRotation = false;
        }
        this.render();

        DCDLastInvoked = Date.now();
    }

    lockPiece(){ // some of the code in this function could definitely be put in functions of their own.
        let rowsToCheckForClears = [];
        let immobility = this.checkImmobility(); //has to be checked before piece is placed on board
        let baseAttack = 0;
        let comboWeightedAttack = 0;
        let surgeBreak = 0;
        let allClear = false;

        //place piece on board
        totalPiecesPlaced++;
        for(let i = 0; i < 4; i++){
            let currentSquare = this.squareCoordinates[i]
            playerBoardState[currentSquare[1]][currentSquare[0]] = this.piece;
            rowsToCheckForClears.push(currentSquare[1]);
            playerSquareManagers[currentSquare[1]][currentSquare[0]].setContents(this.piece);
        }

        rowsToCheckForClears = [...new Set(rowsToCheckForClears)]
        
        //spin detection
        let displayedSpinStatus = "";
        let shortSpinStatus = "";
        if(immobility){
            displayedSpinStatus = `mini ${this.piece}-spin`;
            shortSpinStatus = "mini";
        }
        if(this.piece == "t" && this.lastMoveWasRotation){
            let cornerCount = 0;
            let cornersFaced = 0;
            let centerOfRotationX = this.centerOfRotation[0]
            let centerOfRotationY = this.centerOfRotation[1]

            //very inelegant method of checking the 2-corner mini detection

            if(isCellObstructed([centerOfRotationX-1, centerOfRotationY-1])){
                cornerCount++;
                if(this.currentRotationState%4 == 1 || this.currentRotationState%4 == 2){
                    cornersFaced++;
                }
            }
            if(isCellObstructed([centerOfRotationX-1, centerOfRotationY+1])){
                cornerCount++;
                if(this.currentRotationState%4 == 0 || this.currentRotationState%4 == 1){
                    cornersFaced++;
                }
            }
            if(isCellObstructed([centerOfRotationX+1, centerOfRotationY-1])){
                cornerCount++;
                if(this.currentRotationState%4 == 2 || this.currentRotationState%4 == 3){
                    cornersFaced++;
                }
            }
            if(isCellObstructed([centerOfRotationX+1, centerOfRotationY+1])){
                cornerCount++;
                if(this.currentRotationState%4 == 3 || this.currentRotationState%4 == 0){
                    cornersFaced++;
                }
            }
            if(cornerCount >= 3){
                displayedSpinStatus = `mini t-spin`;
                shortSpinStatus = "mini";
                if(cornersFaced == 2){
                    displayedSpinStatus = `t-spin`;
                    shortSpinStatus = "spin";
                }
            }

            if(this.TSTKickUsed){
                displayedSpinStatus = `t-spin`;
                shortSpinStatus = "spin";
            }
        }

        //line clearing
        let clearStatus = "";
        let rowsCleared = [];
        for(let i = 0; i < rowsToCheckForClears.length; i++){
            let rowIsFull = true;
            for(let j = 0; j < 10; j++){
                if(!isCellObstructed(j, rowsToCheckForClears[i])){
                    rowIsFull = false;
                }
            }
            if(rowIsFull){
                rowsCleared.push(rowsToCheckForClears[i])
            }
        }

        switch(rowsCleared.length){
            case 0:
                break;
            case 1:
                clearStatus = "single";
                if(shortSpinStatus == "spin"){
                    baseAttack = 2;
                }
                break;
            case 2:
                clearStatus = "double";
                if(shortSpinStatus == "spin"){
                    baseAttack = 4;
                }
                else{
                    baseAttack = 1;
                }
                break;
            case 3:
                clearStatus = "triple";
                if(shortSpinStatus == "spin"){
                    baseAttack = 6;
                }
                else{
                    baseAttack = 2;
                }
                break;
            case 4:
                clearStatus = "quad";
                if(shortSpinStatus == "spin"){
                    baseAttack = 8;
                }
                else{
                    baseAttack = 4;
                }
                break;
            default:
                clearStatus = "";
                break;
        }
        totalLinesCleared += rowsCleared.length;

        if(rowsCleared.length != 0){
            combo++;
            if(displayedSpinStatus != "" || rowsCleared.length == 4){
                b2b++; if(b2b > 0){
                    baseAttack += 1;
                }
            }
            else{
                if(b2b >= 4){
                    surgeBreak = b2b;
                }
                b2b=-1;
            }
        }
        else{
            combo=-1;
        }

        if(baseAttack == 0 && combo > 1){
            comboWeightedAttack = downRNGRound(Math.log(1+1.25*combo))
        }
        if(baseAttack > 0){
            comboWeightedAttack = downRNGRound(baseAttack*(1+0.25*combo))
        }

        // play sfx
        // if(rowsCleared.length != 0){
        //     if(shortSpinStatus != ""){
        //         SFX.clearspin.play();
        //     }
        //     else{
        //         if(rowsCleared.length == 4){
        //             SFX.clearquad.play();
        //         }
        //         else{
        //             SFX.clearline.play();
        //         }
        //     }
        // }

        // update board

        for(let row = 0; row < 30; row++){
            let howMuchDoIHaveToLookDown = 0;
            for(let i = 0; i < rowsCleared.length; i++){
                if(row>rowsCleared[i]){
                    howMuchDoIHaveToLookDown++;
                }
            }

            for(let j = 0; j < 10; j++){
                if(howMuchDoIHaveToLookDown > 0){
                    playerBoardState[row-howMuchDoIHaveToLookDown][j] = playerBoardState[row][j]
                    playerSquareManagers[row-howMuchDoIHaveToLookDown][j].setContents(playerSquareManagers[row][j].getContents())
                }
            }
        }
        allClear = boardIsEmpty();

        comboWeightedAttack += surgeBreak + (allClear ? 5 : 0);
        totalAttackSent += comboWeightedAttack;

        //cancel garbage
        if(rowsCleared.length != 0){
            // comboWeightedAttack = PlayerGarbageManager.cancelGarbage(comboWeightedAttack)
            PlayerGarbageManager.cancelGarbage(comboWeightedAttack)
        }
        else{
            PlayerGarbageManager.placeGarbageOnBoard();
        }

        if(Date.now() - lastLineClearAt < 600){
            DOMSpikeTextDisplay.innerText = parseInt(DOMSpikeTextDisplay.innerText) + comboWeightedAttack;
        }
        else{
            DOMSpikeTextDisplay.innerText = comboWeightedAttack;
        }
        if(DOMSpikeTextDisplay.innerText == "0"){
            DOMSpikeTextDisplay.style.display = "none";
        }
        else{
            DOMSpikeTextDisplay.style.display = "block";
        }

        if(rowsCleared.length != 0){
            lastLineClearAt = Date.now();
        }
        



        //announce clears
        DOMClearTextDisplay.innerText = clearStatus + (allClear ? " ALL CLEAR" : "");
        DOMSpinTextDisplay.innerText = displayedSpinStatus;
        if(combo>0){
            DOMComboTextDisplay.innerText = `combo ${combo}`;
        }
        else{
            DOMComboTextDisplay.innerText = ``;
        }
        if(b2b>0){
            DOMB2BTextDisplay.innerText = `b2b x${b2b}`;
        }
        else{
            DOMB2BTextDisplay.innerText = ``;
        }

        this.pullFromQueue();
    }

    hardDrop(){
        this.softDrop();
        this.lockPiece();
    }

    pullFromQueue(){
        const obtainedPiece = PlayerNextManager.advanceQueue();
        this.startPlacingPiece(obtainedPiece);
        holdIsAvailable = true;
        document.getElementById("player-hold").style.filter = "grayscale(0)"
    }
}

class playerGarbageManager{
    constructor(){
        DOMPlayerGarbageDisplay.innerHTML = "";
        this.garbageQueue = [];
        this.totalGarbagePiecesReceived = 0;
        this.garbageDelay = quickPlaySimulatorMode ? 3000 : 0;
    }

    reset(){
        DOMPlayerGarbageDisplay.innerHTML = "";
        this.garbageQueue = [];
        this.totalGarbagePiecesReceived = 0;
        this.garbageDelay = quickPlaySimulatorMode ? 3000 : 0;
    }

    receiveGarbage(amount){
        this.totalGarbagePiecesReceived++;
        let newGarbage = {"order":this.totalGarbagePiecesReceived, "amount": amount, "column": randomIntegerBetween(0,9), "state": this.garbageDelay == 0 ? "ready" : "new", "DOMElement": document.createElement("div")};
        if(this.garbageDelay > 0){
            let currentTotalGarbagePieces = this.totalGarbagePiecesReceived;
            setTimeout(()=>{
                let thisPieceOfGarbage = "";
                for(let i = 0; i < this.garbageQueue.length; i++){
                    if(this.garbageQueue[i].order == currentTotalGarbagePieces){
                        thisPieceOfGarbage = this.garbageQueue[i]
                    }
                }
                if(thisPieceOfGarbage == ""){
                    return;
                }
                thisPieceOfGarbage.state = "warned"
                thisPieceOfGarbage.DOMElement.className = `warned garbage-warning`
            }, this.garbageDelay/2)
            setTimeout(()=>{    
                let thisPieceOfGarbage = "";
                for(let i = 0; i < this.garbageQueue.length; i++){
                    if(this.garbageQueue[i].order == currentTotalGarbagePieces){
                        thisPieceOfGarbage = this.garbageQueue[i]
                    }
                }
                if(thisPieceOfGarbage == ""){
                    return;
                }
                thisPieceOfGarbage.state = "ready"
                thisPieceOfGarbage.DOMElement.className = `ready garbage-warning`
            }, this.garbageDelay)
        }
        this.garbageQueue.push(newGarbage);
        this.render();
    }

    cancelGarbage(amountToBeCancelled){
        let attackLeft = amountToBeCancelled;
        while(attackLeft > 0){
            if(this.garbageQueue.length==0){
                this.render();
                return(attackLeft);
            }
            if(this.garbageQueue[0].amount <= attackLeft){
                attackLeft -= this.garbageQueue[0].amount;
                this.garbageQueue.shift();
            }
            else{
                this.garbageQueue[0].amount -= attackLeft;
                attackLeft = 0;
            }
        }
        this.render();
        return(0);
    }

    placeSpecificLinesOnBoard(numberOfLines, column){
        const oldBoardState = JSON.parse(JSON.stringify(playerBoardState));
        for(let y = numberOfLines; y < 30; y++){
            for(let x = 0; x < 10; x++){
                playerBoardState[y][x] = oldBoardState[y-numberOfLines][x]
                playerSquareManagers[y][x].setContents(oldBoardState[y-numberOfLines][x])
            }
        }
        for(let y = 0; y < numberOfLines; y++){
            for(let x = 0; x < 10; x++){
                playerBoardState[y][x] = x==column ? "" : "garbage"
                playerSquareManagers[y][x].setContents(x==column ? "empty" : "garbage")
            }
        }
    }

    placeGarbageOnBoard(){
        let linesLeftToPlace = garbageCap;

        let notYetReadyToPlace = [];
        while(linesLeftToPlace > 0){
            if(this.garbageQueue.length==0){
                break;
            }
            if(this.garbageQueue[0].amount <= linesLeftToPlace){
                if(this.garbageQueue[0].state == "ready"){
                    this.placeSpecificLinesOnBoard(this.garbageQueue[0].amount, this.garbageQueue[0].column)
                    linesLeftToPlace -= this.garbageQueue[0].amount;
                }
                else{
                    notYetReadyToPlace.push(this.garbageQueue[0])
                }
                this.garbageQueue.shift();
            }
            else{
                if(this.garbageQueue[0].state == "ready"){
                    this.placeSpecificLinesOnBoard(linesLeftToPlace, this.garbageQueue[0].column)
                    this.garbageQueue[0].amount -= linesLeftToPlace;
                    break;
                }
                else{
                    notYetReadyToPlace.push(this.garbageQueue[0]);
                    break;
                }
            }
        }

        this.garbageQueue = this.garbageQueue.concat(notYetReadyToPlace)

        this.render();
    }

    render(){
        DOMPlayerGarbageDisplay.innerHTML = "";

        let heightOfCurrentGarbageWarning = 0;
        for(let i = 0; i < this.garbageQueue.length; i++){
            let newGarbageWarning = document.createElement("div");
            newGarbageWarning.className = `${this.garbageQueue[i].state} garbage-warning`;
            newGarbageWarning.style.height = `${this.garbageQueue[i].amount * squareSize}px`;
            newGarbageWarning.style.bottom = `${heightOfCurrentGarbageWarning}px`;
            DOMPlayerGarbageDisplay.appendChild(newGarbageWarning);

            this.garbageQueue[i].DOMElement = newGarbageWarning;
            heightOfCurrentGarbageWarning += this.garbageQueue[i].amount * squareSize;
        }
    }
}

// ----------------- FUNCTIONS ---------------------

// angle in degrees instead of radians! also angle points counterclockwise!
const rotatePointAroundCenter = (point, center, angle) =>{
    const difference = [point[0]-center[0], point[1]-center[1]]
    const radianAngle = angle / 180 * Math.PI
    const rotatedDifference = [difference[0]*Math.cos(radianAngle)-difference[1]*Math.sin(radianAngle), difference[0]*Math.sin(radianAngle)+difference[1]*Math.cos(radianAngle)]
    return [Math.round(center[0]+rotatedDifference[0]), Math.round(center[1]+rotatedDifference[1])]
}

const shuffleArray = (array)=>{
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}

const generateBag = ()=>{
    return shuffleArray(["i", "j", "o", "l", "s", "t", "z"])
}

const createPlayerBoard = ()=>{
    playerSquareManagers = []; playerBoardState = [];
    playerBoard.innerHTML = "";
    for(let y = 0; y < 30; y++){
        let playerSquareManagerRow = []
        let playerBoardStateRow = []
        for(let x = 0; x < 10; x++){
            playerSquareManagerRow.push(new squareManager(x, y))
            playerBoardStateRow.push("")
        }
        playerSquareManagers.push(playerSquareManagerRow);
        playerBoardState.push(playerBoardStateRow)
    }
}

const lose = ()=>{
    //alert("you have not win! you.... DIED!!! [sic]")
    hasDied = true;
    document.getElementById("playfield-container").style.filter = "grayscale(1)"
}

const isCellObstructed = (x, y)=>{
    if(Array.isArray(x)){
        if(x[1] < 0 || x[1] > 29 || x[0] < 0 || x[0] > 9){
            return true;
        }
        return(playerBoardState[x[1]][x[0]]!="")
    }
    if(x<0 || x>9 || y<0 || y>29){
        return true;
    }
    return(playerBoardState[y][x]!="")
}

const hold = ()=>{
    if(holdIsAvailable){
        if(PlayerHoldManager.getHoldPiece() == "empty"){
            PlayerHoldManager.hold(PlayerCurrentPieceManager.getCurrentPiece());
            PlayerCurrentPieceManager.pullFromQueue();
        }
        else{
            let newHoldPiece = PlayerCurrentPieceManager.getCurrentPiece();
            PlayerCurrentPieceManager.startPlacingPiece(PlayerHoldManager.getHoldPiece());
            PlayerHoldManager.hold(newHoldPiece);
        }
    }
    holdIsAvailable = false;
    document.getElementById("player-hold").style.filter = "grayscale(1)"
}

const formatTimeDifference = (timeDifference)=>{
    let ms = Math.round(timeDifference % 1000);
    let ss = Math.floor(timeDifference / 1000) % 60;
    let mm = Math.floor(timeDifference / 1000 / 60) % 60;

    return(`${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}:${ms.toString().padStart(3, "0")}`);
}

const pollForMovement = ()=>{
    if(hasDied){
        return;
    }

    //DAS actions
    if(Date.now() - DCDLastInvoked >= DCD){
        if(ARR==0){
            if(controls.MOVE_LEFT.held && Date.now()-controls.MOVE_LEFT.heldFrom >= DAS){
                PlayerCurrentPieceManager.DASLeft();
            }
            if(controls.MOVE_RIGHT.held && Date.now()-controls.MOVE_RIGHT.heldFrom >= DAS){
                PlayerCurrentPieceManager.DASRight();
            }
        }
        else{
            if(controls.MOVE_LEFT.held && Date.now()-controls.MOVE_LEFT.heldFrom >= DAS && Date.now()-ARRLastInvoked >= ARR){
                PlayerCurrentPieceManager.tryToMoveLeft();
                ARRLastInvoked = Date.now();
            }
            if(controls.MOVE_RIGHT.held && Date.now()-controls.MOVE_RIGHT.heldFrom >= DAS && Date.now()-ARRLastInvoked >= ARR){
                PlayerCurrentPieceManager.tryToMoveRight();
                ARRLastInvoked = Date.now();
            }
            
        }
        if(controls.SOFT_DROP.held && Date.now()-controls.SOFT_DROP.heldFrom >= DAS){
            PlayerCurrentPieceManager.softDrop();
        }
    }

    const timeElapsed = Date.now() - gameStartedAt;
    DOMTimeDisplay.innerText = `time: ${formatTimeDifference(timeElapsed)}`
    DOMPPSDisplay.innerText = `pieces: ${totalPiecesPlaced} (${roundToTwoPlaces(totalPiecesPlaced / (timeElapsed / 1000))}/s)`
    DOMAPMDisplay.innerText = `attack: ${totalAttackSent} (${roundToTwoPlaces(totalAttackSent / (timeElapsed / 60000))}/m)`
    DOMAPPDisplay.innerText = `app: ${roundToTwoPlaces(totalAttackSent / totalPiecesPlaced)}`
    DOMVSDisplay.innerText = `vs score: ${roundToTwoPlaces( (totalAttackSent + totalLinesCleared) / (timeElapsed / 100000))}`

    // document.getElementById("opponent-apm").innerText = `opponent apm: ${roundToTwoPlaces(opponentLinesSent / (timeElapsed / 60000))}`
    document.getElementById("opponent-apm").innerText = `opponent apm: ${roundToTwoPlaces((parseInt(survivalInitialAPM) + survivalAPMIncrease*(Date.now()-gameStartedAt)/60000))}`

    if(ARR != 0){
        window.requestAnimationFrame(pollForMovement)
    }
}

const downRNGRound = (x)=>{
    const result = Math.random()<(x-Math.floor(x))?Math.ceil(x):Math.floor(x);
    return result;
}

const roundToTwoPlaces = (number)=>{
    return Math.round(number *100) /100 // i love floating point precision issues
}

const randomIntegerBetween = (lowerBound, upperBound)=>{
    return Math.floor(Math.random()*(upperBound-lowerBound)+lowerBound)
}

const boardIsEmpty = ()=>{
    for(let y = 0; y < 30; y++){
        for(let x = 0; x < 10; x++){
            if(playerBoardState[y][x] != ""){
                return false;
            }
        }
    }
    return true;
}

// okay i'm just having fun now

const tryWindup = ()=>{
    if(hasDied){
        return;
    }
    survivalInitialAPM = parseInt(survivalInitialAPM);

    let targetAmount = ((survivalInitialAPM + survivalAPMIncrease*(Date.now()-gameStartedAt)/60000) / (60000 / survivalTimeBetweenAttacks)) / 1.5;
    console.log(typeof(survivalInitialAPM));
    let actualAmount = downRNGRound(targetAmount * (randomIntegerBetween(10,20)/10))
    let amountRemaining = actualAmount;
    opponentLinesSent += actualAmount;

    let windupType = Math.min(Math.floor((actualAmount - 6)/3), 4)

    let chunks = [];
    for(let i = 0; i < 3; i++){
        if(amountRemaining >= 4){
            amountRemaining -= 4;
            chunks.push(4);
        }
        else{
            chunks.push(amountRemaining);
            amountRemaining = 0;
            break;
        }
    }
    if(amountRemaining > 0){
        chunks.push(amountRemaining);
    }

    setTimeout(()=>{
        for(let i = 0; i < chunks.length; i++){
            PlayerGarbageManager.receiveGarbage(chunks[i]);
        }
    }, 1000)

    switch(windupType){
        case 1:
            SFX.windup1.play();
            break;
        case 2:
            SFX.windup2.play();
            break;
        case 3:
            SFX.windup3.play();
            break;
        case 4:
            SFX.windup4.play();
            break;
        default:
            break;
    }
}

const importSettings = ()=>{
    controls.CCW.key = document.getElementById("controls-ccw").value;
    controls.CW.key = document.getElementById("controls-cw").value;
    controls.ROTATE_180.key = document.getElementById("controls-180").value;
    controls.MOVE_LEFT.key = document.getElementById("controls-left").value;
    controls.MOVE_RIGHT.key = document.getElementById("controls-right").value;
    controls.SOFT_DROP.key = document.getElementById("controls-sd").value;
    controls.HARD_DROP.key = document.getElementById("controls-hd").value;
    controls.HOLD.key = document.getElementById("controls-hold").value;

    ARR = document.getElementById("handling-arr").value;
    DAS = document.getElementById("handling-das").value;
    DCD = document.getElementById("handling-dcd").value;

    survivalTimeBetweenAttacks = parseInt(document.getElementById("survival-time-between-attacks").value);
    survivalInitialAPM = parseInt(document.getElementById("survival-initial-apm").value);
    survivalAPMIncrease = parseInt(document.getElementById("survival-apm-increase").value);

    saveSettingsToLocalStorage();
}

const saveSettingsToLocalStorage = ()=>{
    localStorage.setItem("CCW", controls.CCW.key)
    localStorage.setItem("CW", controls.CW.key)
    localStorage.setItem("ROTATE_180", controls.ROTATE_180.key)
    localStorage.setItem("MOVE_LEFT", controls.MOVE_LEFT.key)
    localStorage.setItem("MOVE_RIGHT", controls.MOVE_RIGHT.key)
    localStorage.setItem("SOFT_DROP", controls.SOFT_DROP.key)
    localStorage.setItem("HARD_DROP", controls.HARD_DROP.key)
    localStorage.setItem("HOLD", controls.HOLD.key)

    localStorage.setItem("DAS", DAS)
    localStorage.setItem("DCD", DCD)
    localStorage.setItem("ARR", ARR)

    localStorage.setItem("survivalTimeBetweenAttacks", survivalTimeBetweenAttacks)
    localStorage.setItem("survivalInitialAPM", survivalInitialAPM)
    localStorage.setItem("survivalAPMIncrease", survivalAPMIncrease)

}

const getSettingsFromLocalStorage = ()=>{
    controls.CCW.key = localStorage.getItem("CCW")
    controls.CW.key = localStorage.getItem("CW")
    controls.ROTATE_180.key = localStorage.getItem("ROTATE_180")
    controls.MOVE_LEFT.key = localStorage.getItem("MOVE_LEFT")
    controls.MOVE_RIGHT.key = localStorage.getItem("MOVE_RIGHT")
    controls.SOFT_DROP.key = localStorage.getItem("SOFT_DROP")
    controls.HARD_DROP.key = localStorage.getItem("HARD_DROP")
    controls.HOLD.key = localStorage.getItem("HOLD")

    ARR = localStorage.getItem("ARR")
    DAS = localStorage.getItem("DAS")
    DCD = localStorage.getItem("DCD")

    survivalTimeBetweenAttacks = localStorage.getItem("survivalTimeBetweenAttacks")
    survivalInitialAPM = localStorage.getItem("survivalInitialAPM")
    survivalAPMIncrease = localStorage.getItem("survivalAPMIncrease")
}

const displaySettings = ()=>{
    document.getElementById("controls-ccw").value = controls.CCW.key;
    document.getElementById("controls-cw").value = controls.CW.key;
    document.getElementById("controls-180").value = controls.ROTATE_180.key;
    document.getElementById("controls-left").value = controls.MOVE_LEFT.key;
    document.getElementById("controls-right").value = controls.MOVE_RIGHT.key;
    document.getElementById("controls-sd").value = controls.SOFT_DROP.key;
    document.getElementById("controls-hd").value = controls.HARD_DROP.key;
    document.getElementById("controls-hold").value = controls.HOLD.key;

    document.getElementById("handling-arr").value = ARR;
    document.getElementById("handling-das").value = DAS;
    document.getElementById("handling-dcd").value = DCD;

    document.getElementById("survival-time-between-attacks").value = survivalTimeBetweenAttacks;
    document.getElementById("survival-initial-apm").value = survivalInitialAPM;
    document.getElementById("survival-apm-increase").value = survivalAPMIncrease;
}

// ----------------- INITIALIZATION ---------------------

let pollingInterval, windupInterval, opponentLinesSent;

const onKeyDown = (e)=>{
    if(e.repeat){
        return;
    }
    if(hasDied){
        return;
    }
    for(const [pairKey, value] of Object.entries(controls)){
        if(e.key == value.key){
            controls[pairKey].held = true;
            controls[pairKey].heldFrom = Date.now();
        }
    }
    switch(e.key){
        default:
            DCDLastInvoked = Date.now();
        case controls["CCW"].key:
            PlayerCurrentPieceManager.rotateCCW();
            break;
        case controls["CW"].key:
            PlayerCurrentPieceManager.rotateCW();
            break;  
        case controls["ROTATE_180"].key:
            PlayerCurrentPieceManager.rotate180();
            break;
        case controls["MOVE_LEFT"].key:
            PlayerCurrentPieceManager.tryToMoveLeft();
            setTimeout(()=>{if(controls["MOVE_LEFT"].held && ARR==0){PlayerCurrentPieceManager.DASLeft()}}, DAS)
            break;
        case controls["MOVE_RIGHT"].key:
            PlayerCurrentPieceManager.tryToMoveRight();
            setTimeout(()=>{if(controls["MOVE_RIGHT"].held && ARR==0){PlayerCurrentPieceManager.DASRight()}}, DAS)
            break;
        case controls["SOFT_DROP"].key:
            PlayerCurrentPieceManager.softDrop();
            break;
        case controls["HARD_DROP"].key:
            PlayerCurrentPieceManager.hardDrop();
            break;
        case controls["HOLD"].key:
            hold();
            break;
        case "3":
            PlayerGarbageManager.receiveGarbage(3);
            break;
        case "6":
            PlayerGarbageManager.receiveGarbage(6);
            break;
        case "9":
            PlayerGarbageManager.receiveGarbage(9);
            break;
    }
}

const onKeyUp = (e)=>{
    for(const [pairKey, value] of Object.entries(controls)){
        if(e.key == value.key){
            controls[pairKey].held = false;
        }
    }
}

const newGame = ()=>{
    hasDied = false;
    gameStartedAt = Date.now();
    totalAttackSent = 0;
    totalLinesCleared = 0;
    totalPiecesPlaced = 0;

    document.getElementById("playfield-container").style.filter = "grayscale(0)";

    clearInterval(pollingInterval); clearInterval(windupInterval);

    createPlayerBoard()

    PlayerHoldManager.reset(); PlayerNextManager.reset(); PlayerCurrentPieceManager.reset(); PlayerGarbageManager.reset();

    if(ARR==0){
        pollingInterval = setInterval(pollForMovement, controlsPollingRate)
    }

    opponentLinesSent = 0;

    windupInterval = setInterval(()=>{tryWindup();}, 5000);
}


const startFirstGame = ()=>{

    PlayerHoldManager = new playerHoldManager()

    PlayerNextManager = new playerNextManager();

    PlayerCurrentPieceManager = new currentPieceManager();

    PlayerGarbageManager = new playerGarbageManager();

    document.addEventListener("keydown", (e)=>{onKeyDown(e)})

    document.addEventListener("keyup", (e)=>{onKeyUp(e)})

    newGame();

    if(ARR != 0){
        requestAnimationFrame(pollForMovement)
    }
}

const resetOrStartGame = ()=>{
    if(firstGameStarted){
        newGame();
    }
    else{
        startFirstGame(); firstGameStarted = true;
    }
}

document.getElementById("start-game").addEventListener("mousedown", resetOrStartGame)
document.getElementById("submit").addEventListener("mousedown", importSettings)
document.addEventListener("keypress", (e)=>{
    console.log(e.key)
    if(e.key == "Enter"){
        resetOrStartGame();
    }
})

if(!(localStorage.getItem("CCW") === null)){
    getSettingsFromLocalStorage();
    displaySettings();
}
