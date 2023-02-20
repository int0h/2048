let matrix = makeEmptyMatrix(3);
const w = Math.floor((screen.width - 160) / 50) * 50;
const tileSize = w / 3;
document.querySelector('.field').style.fontSize = tileSize + 'px';
let tiles = [];
let field;
let score = 0;
let gameHistory = [];
let swipeHandlers = [];

function nullPadLeft(a, size) {
	return [...nullArray(size - a.length), ...a];
}

function nullArray(size) {
	let a = [];
	for (let i = 0; i < size; i++) {
		a.push(null);
	}
	return a;
}

function shiftRow(a, d) {
    let success = false;
    let commonShift = 0;
    let neihbor;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === null) {
            commonShift++;
            continue;
        }
        const newCoords = [a[i].x + d.x * commonShift, a[i].y + d.y * commonShift];        
        if (neihbor && a[i].n === neihbor.n) {
            a[i].move(true, neihbor.x, neihbor.y);
            neihbor.updateN(a[i].n * 2);
            updateScore(score + a[i].n * 2);
            commonShift++;
            success = true;
        } else {
            if (a[i].x !== newCoords[0] || a[i].y !== newCoords[1]) {
                a[i].move(false, ...newCoords);
                success = true;   
            }            
        }
        neihbor = a[i];
    }
    console.log(success);
    return success;
}

function getColor(n) {
    return `hsl(${(Math.log2(n) * 18) % 180}, 85%, 85%)`;
}

class Tile {
    constructor(n, x, y) {        
        this.n = n;
        this.x = x;
        this.y = y;
        const tile = document.createElement('div');
        this.dom = tile;
        tile.className = 'tile n-tile';  
        tile.style.transform = `translate(${x * tileSize}px, ${y * tileSize}px)`;
        tile.style.background = getColor(n);
        tile.style.opacity = '0.3';
        this.dom.style.zIndex = n;
        const tileLabel = document.createElement('div');
        tileLabel.innerText = n;
        tileLabel.className = 'tile-label';  
        this.tileLabel = tileLabel;
        tile.appendChild(tileLabel);
        field.appendChild(tile);
        setTimeout(() => {
            tile.style.opacity = '1';
        }, 0);
        this.id = tiles.length;
        tiles.push(this);
        matrix[y][x] = this;
    }

    updateN(newN) {
        this.n = newN;
        this.tileLabel.innerText = newN;
        this.dom.style.background = getColor(newN);
        this.dom.style.zIndex = newN;
    }

    move(destroy, x, y) {
        this.dom.style.transform = `translate(${x * tileSize}px, ${y * tileSize}px)`;
        matrix[this.y][this.x] = null;
        if (destroy) {
            this.destroy();
        } else {
            matrix[y][x] = this;
        }
        this.x = x;
        this.y = y;
    }

    destroy() {
        tiles.splice(tiles.indexOf(this), 1);
        setTimeout(() => {
            this.dom.remove();
        }, 200);
    }
}

function makeEmptyMatrix(size) {
    const res = [];
    for (let x = 0; x < size; x++) {
        const col = [];
        for (let y = 0; y < size; y++) {
            col.push(null);
        }
        res.push(col);
    }
    return res;
}



function drawField(size) {
    field = document.querySelector('.field');
    for (let i = 0; i < size ** 2; i++) {
        const bgTile = document.createElement('div');
        bgTile.className = 'tile bg-tile';        
        field.appendChild(bgTile);
    }
    field.style.width = size * tileSize + 'px';
    field.style.height = size * tileSize + 'px';
}

function rotateCoords(x, y, d, s) {
    switch ((d + 4) % 4) {
        case 0:
            return [x, y];
        case 1:
            return [s - y - 1, x];
        case 2:
            return [s - x - 1, s - y - 1]
        case 3:
            return [y, s - x - 1];
    }
}

function rotateMatrix(matrix, d) {
    const r = makeEmptyMatrix(matrix.length);
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        for (let x = 0; x < row.length; x++) {
            const [nx, ny] = rotateCoords(x, y, d, matrix.length);
            r[ny][nx] = matrix[y][x];
        }        
    }
    return r;
}

function shiftMatrix(matrix, d) {
    let success = false;
    let m = rotateMatrix(matrix, dMap[d]);
    m = m.map(row => {
        success = shiftRow(row, ddMap[d]) || success;
    });
    return success;
}

const ddMap = {
    ArrowLeft: {x: -1, y: 0},
    ArrowUp: {x: 0, y: -1},
    ArrowRight: {x: 1, y: 0},
    ArrowDown: {x: 0, y: 1},
};

const dMap = {
    ArrowLeft: 0,
    ArrowUp: 3,
    ArrowRight: 2,
    ArrowDown: 1
}

function spawn(matrix) {
    const n = Math.random() > 0.5 ? 2 : 4;
    const pos = Math.round(Math.random() * 1e6) % (matrix.length ** 2 - tiles.length);
    let cur = 0;
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        for (let x = 0; x < row.length; x++) {
            if (matrix[y][x]) {
                continue;
            }
            if (cur === pos) {
                new Tile(n, x, y);
                //matrix[y][x] = n;
                return;
            }
            cur++;
        }        
    }
}

function goToHistory(n) {
    if (n < 0) {
        return;
    }
    historyInput.value = n;
    applyMatrix(gameHistory[n].field);
    updateScore(gameHistory[n].score);
}

const historyInput = document.querySelector('#history');
historyInput.addEventListener('input', () => {
    goToHistory(historyInput.value);
});

function makeMove(d) {
    gameHistory = gameHistory.slice(0, Number(historyInput.value) + 1); 
    const success = shiftMatrix(matrix, d);
    if (!success) {
        return;
    }
    spawn(matrix);
    gameHistory.push({
        field: cloneMatrix(matrix),
        score,
    });
    historyInput.max = gameHistory.length - 1;
    historyInput.value = gameHistory.length - 1;
}

document.body.addEventListener('keyup', e => {
    const d = dMap[e.key];
    if (d === undefined) {
        return;
    }
    makeMove(e.key);
});

const sMap = {
    left: 'ArrowLeft',
    up: 'ArrowUp',
    right: 'ArrowRight',
    down: 'ArrowDown',
}

onSwipe((e, type) => {
    const d = sMap[type];
    if (e.target.closest('.history')) {
        return;
    }
    if (d === undefined) {
        return;
    }
    e.preventDefault();
    makeMove(d);
});

document.querySelector('#undo').addEventListener('click', () => {
    goToHistory(historyInput.value - 1);
});

function cloneMatrix(matrix) {
    return matrix.map(row => row.map(i => i && i.n));
}

function applyMatrix(m) {
    [...tiles].forEach(t => t.destroy());
    matrix = makeEmptyMatrix(3);
    m.forEach((row, y) => {
        row.forEach((n, x) => {
            if (n) {
                new Tile(n, x, y);
            }
        })
    });
}

function updateScore(s) {
    score = s;
    document.querySelector('.score').textContent = `Score: ${s}`;
}

function onSwipe(cb) {
    swipeHandlers.push({
        cb
    });
}

(() => {
    document.addEventListener('touchstart', handleTouchStart, false);        
    document.addEventListener('touchmove', handleTouchMove, false);

    var xDown = null;                                                        
    var yDown = null;                                                        

    function handleTouchStart(evt) {                                         
        xDown = evt.touches[0].clientX;                                      
        yDown = evt.touches[0].clientY;                                      
    };                                                

    function handleTouchMove(evt) {
        if ( ! xDown || ! yDown ) {
            return;
        }

        var xUp = evt.touches[0].clientX;                                    
        var yUp = evt.touches[0].clientY;

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        let type;
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
            if ( xDiff > 0 ) {
                type = 'left';
            } else {
                type = 'right';
                /* right swipe */
            }                       
        } else {
            if ( yDiff > 0 ) {
                type = 'up';
                /* up swipe */ 
            } else { 
                type = 'down';
                /* down swipe */
            }                                                                 
        }
        swipeHandlers
            .forEach(h => {
                h.cb(evt, type);
            });
        /* reset values */
        xDown = null;
        yDown = null;                                             
    };
})();

drawField(3);

spawn(matrix);
gameHistory.push({
    field: cloneMatrix(matrix),
    score: 0
});