const playButton = document.getElementById("PlayButton");
const mainMenuPanel = document.getElementById("MainMenuPanel");
const gamePanel = document.getElementById("Board");
const gameContent = document.getElementById("Content");
const scoreText = document.getElementById("ScoreText");
const timerText = document.getElementById("TimerText");
const gameOverPanel = document.getElementById("GameOverBackground");
const gameOverHighscoreText = document.getElementById("GameOverHighScoreText");
const gameOverScoreText = document.getElementById("GameOverScoreText");

let fieldDictionary = {};
let timer = 99;
let timerIntervalId = 0;
let timerInterval = () => {
    if(timer == 0) {
        showGameOverPanel();
        return;
    }
    timer--;
    timerText.innerHTML = generateBigNumbers(timer.toString());
}

let lastFields: Array<Field> = new Array<Field>();

let offsetX = 0;
let offsetY = 0;

let score = 0;

const fieldSize = 64;
const screenWidth = window.innerWidth
const screenHeight = window.innerHeight;
let isDragging: boolean = false;
let hasDragged: boolean = false;
let lastMousePosX = 0;
let lastMousePosY = 0;

playButton.addEventListener("click", startGame);
gamePanel.addEventListener("mousedown", (e) => {
    e.preventDefault();
    lastMousePosX = e.x;
    lastMousePosY = e.y;
    isDragging = true;
});
gamePanel.addEventListener("mousemove", (e) => {
    if (isDragging) {
        hasDragged = true;
        e.preventDefault();
        offsetX += lastMousePosX - e.x;
        offsetY += lastMousePosY - e.y;
        lastMousePosX = e.x;
        lastMousePosY = e.y;
        onMoved();
    }
});
gamePanel.addEventListener("mouseup", (e) => {
    e.preventDefault();
    isDragging = false;
});
gamePanel.style.visibility = "hidden";

/**
 * Versteckt das Menü und startet das Spiel
 */
function startGame() {
    mainMenuPanel.style.visibility = "hidden";
    gamePanel.style.visibility = "visible";
    onMoved();
    timerIntervalId = setInterval(timerInterval, 1000);
}

/**
 * Zeigt alle Felder an, die der Spieler sehen kann nachdem das Spielfeld bewegt wurde.
 */
function onMoved() {
    gameContent.style.left = -offsetX.toString() + "px";
    gameContent.style.top = -offsetY.toString() + "px";

    let startX = Math.ceil(offsetX / fieldSize);
    let startY = Math.ceil(offsetY / fieldSize);

    let endX = Math.floor((offsetX + screenWidth) / fieldSize);
    let endY = Math.floor((offsetY + screenHeight) / fieldSize);

    for(let i = 0; i < lastFields.length; i++) {
        let f: Field = lastFields[i];
        if(f.posX < startX || f.posX > endX || f.posY < startY || f.posY > endY)
            f.element.style.display = "none";
    }

    let fieldsToDraw: Array<Field> = getOrGenerateAllFieldsBetween(startX - 1, startY - 1, endX + 1, endY + 1);
    fieldsToDraw.forEach(x => x.element.style.display = "block");

    lastFields = fieldsToDraw;
}

/**
 * Platziert ein neues Feld an der angegebenen Koordinate
 * @param x - X-Koordinate des Feldes
 * @param y - Y-Koordinate des Feldes
 */
function placeFieldAt(x: number, y: number): Field {
    let val = getRandomFieldValue();
    let image: HTMLImageElement = new Image();
    image.width = image.height = fieldSize;
    image.src = "assets/field--1.png";
    image.style.position = "absolute";
    image.style.left = (x * fieldSize).toString() + "px";
    image.style.top = (y * fieldSize).toString() + "px";
    image.style.width = fieldSize.toString() + "px";
    image.style.height = fieldSize.toString() + "px";
    let field = new Field(x, y, val, false, image, false);
    image.addEventListener("click", (e) => {
        e.preventDefault();
        clickedOn(field);
    });
    image.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        rightClickedOn(field);
    });
    fieldDictionary[x + "-" + y] = field;
    gameContent.appendChild(image);
    return field;
}

/**
 * Wird ausgeführt, wenn der Spieler ein Feld angeklickt hat
 * @param field - das angeklickte Feld
 */
function clickedOn(field: Field) {
    if (hasDragged) {
        hasDragged = false;
        return;
    }
    if(field.value == 9) {
        gameOver(field);
        return;
    }
    if(!field.flagged && !field.revealed)
        floodReveal(field);
}

/**
 * Animiert das Feld, wenn der Spieler auf eine Bombe geklickt hat.
 * @param reason - Das Feld mit der Mine, das der Spieler angeklickt hat
 */
function gameOver(reason: Field) {
    reason.element.src = "assets/field-9.png";
    gameContent.style.transition = "all 1s";
    reason.element.style.transition = "all 1s";
    reason.element.style.width = "96px"
    reason.element.style.height = "96px"
    reason.element.style.zIndex = "1";
    reason.element.style.left = (parseInt(reason.element.style.left.replace("px", "")) - 16) + "px";
    reason.element.style.top = (parseInt(reason.element.style.top.replace("px", "")) - 16) + "px";
    for(let i = 0; i < lastFields.length; i++) {
        if(lastFields[i] == reason) continue;
        setTimeout(() => {
            if(lastFields[i].value == 9) {
                lastFields[i].element.src = "assets/field-9.png";
                return;
            }
            lastFields[i].element.style.transition = "all 0.1s";
            lastFields[i].element.style.opacity = "0";
        }, i * 2);
    }
    setTimeout(showGameOverPanel, lastFields.length * 2);
}

/**
 * Zeigt das GameOver Menü an
 */
function showGameOverPanel() {
    clearInterval(timerIntervalId);
    gameOverScoreText.innerHTML = generateBigNumbers(score.toString());
    let highscore = localStorage.getItem("Highscore");
    if(highscore == null || score > parseInt(highscore)) {
        localStorage.setItem("Highscore", score.toString());
        highscore = score.toString();
    }
    gameOverPanel.style.display = "block";
    gameOverHighscoreText.innerHTML = generateBigNumbers(highscore);
    gameOverPanel.style.opacity = "1";
}

/**
 * Lädt die Seite neu
 */
function reloadPage() {
    window.location.href = location.protocol + '//' + location.host + location.pathname;
}

/**
 * Lädt die Seite neu und fügt den Parameter 'directReplay' hinzu, um das Spiel direkt neu zu starten
 */
function reloadPageToGame() {
    window.location.href = location.protocol + '//' + location.host + location.pathname + "?directPlay";
}

/**
 * Platziert eine Flagge, wenn ein Feld angeklickt wurde
 * @param field - angeklicktes Feld
 */
function rightClickedOn(field: Field) {
    if(field.revealed)
        return;
    field.flagged = !field.flagged;
    if(field.flagged)
        field.element.src = "assets/field-flagged.png";
    else
        field.element.src = "assets/field--1.png";
}

/**
 * Deckt alle benachbarten Felder auf.
 * Wenn das Feld leer ist, werden die Nachbarn ebenfalls aufgedeckt.
 * Wenn das Feld eine Zahl enthält, wird es zwar aufgedeckt, benachbarte Felder jedoch nicht.
 * @param field - das Feld, von dem die Suche gestartet werden soll
 */
function floodReveal(field: Field): void {
    let counter = 0;
    let fieldPositions: Array<Field> = new Array<Field>();
    let mineCount = 0;
    fieldPositions.push(field);
    while (fieldPositions.length > 0) {
        mineCount = 0;
        let neighbours: Array<Field> = new Array<Field>();
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0)
                    continue;
                let neighbour: Field = getOrGenerateField(fieldPositions[0].posX + x, fieldPositions[0].posY + y);
                if (neighbour.value === 9) {
                    mineCount++;
                }
                neighbours.push(neighbour);
            }
        }
        if (mineCount == 0) {
            neighbours.forEach(n => {
                if (fieldPositions.indexOf(n) === -1 && n.value < 9 && !n.revealed && !n.flagged) {
                    fieldPositions.push(n);
                }
            });
        }
        counter++;
        fieldPositions[0].revealed = true;
        fieldPositions[0].value = mineCount;
        score += mineCount;
        fieldPositions[0].element.src = "assets/field-" + mineCount + ".png";
        fieldPositions.shift();
    }
    if(counter == 1) {
        score += mineCount * 2;
    }
    updateScore();
}

/**
 * Aktualisiert den Score-Text oben links
 */
function updateScore() {
    scoreText.innerHTML = generateBigNumbers(score.toString());
}

/**
 * Falls ein Feld an dieser Position vorhanden ist, wird es zurückgegeben.
 * Falls nicht, wird das Feld neu erstellt.
 * @param x - X-Koordinate des Feldes
 * @param y - Y-Koordinate des Feldes
 */
function getOrGenerateField(x: number, y: number): Field {
    let field = fieldDictionary[x + "-" + y] as Field;
    return field ? field : placeFieldAt(x,y);
}

/**
 * Gibt alle Felder innerhalb eines bestimmten Bereiches zurück
 * @param minX - X-Koordinate der linken oberen Ecke
 * @param minY - Y-Koordinate der linken oberen Ecke
 * @param maxX - X-Koordinate der rechten unteren Ecke
 * @param maxY - Y-Koordinate der rechten unteren Ecke
 */
function getOrGenerateAllFieldsBetween(minX: number, minY: number, maxX: number, maxY: number) : Array<Field> {
    let fieldsBetween: Array<Field> = new Array<Field>();
    for(let x = minX; x < maxX; x++) {
        for(let y = minY; y < maxY; y++) {
            fieldsBetween.push(getOrGenerateField(x,y));
        }
    }
    return fieldsBetween;
}

/**
 * Gibt 0 zurück, wenn es sich um ein leeres Feld handelt.
 * Gibt 9 zurück, wenn das Feld eine Miene sein soll.
 */
function getRandomFieldValue() {
    if (Math.random() * 100 <= 16.25)
        return 9;
    else return 0;
}

/**
 * Generiert einen HTML-String, der alle Zahlen eines Strings als <img>-Elemente darstellt
 * @param numbertext - der Text, der dargestellt werden soll. Darf aktuell nur Zahlen beinhalten
 */
function generateBigNumbers(numbertext: string): string {
    var bigNumbers = "";
    for (var i = 0; i < numbertext.length; i++) {
        bigNumbers += `<img src='assets/nums/Num_${numbertext.charAt(i)}.png' class='image-number' alt='${numbertext.charAt(i)}'>`
    }
    return bigNumbers;
}

class Field {
    posX: number
    posY: number
    value: number
    revealed: boolean
    element: HTMLImageElement
    flagged: boolean


    constructor(posX: number, posY: number, value: number, revealed: boolean, element: HTMLImageElement, flagged: boolean) {
        this.posX = posX;
        this.posY = posY;
        this.value = value;
        this.revealed = revealed;
        this.element = element;
        this.flagged = flagged;
    }
}

if((new URLSearchParams(window.location.search)).has("directPlay"))
    startGame();
else
    document.getElementById("HighscoreText").innerHTML = generateBigNumbers(localStorage.getItem("Highscore") ?? "0");
