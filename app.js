//Dohvaćanje referenci canvasa i konteksta
const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');
const crashAudio = new Audio("./crash.mp3");
//Pomoćna funkcija za odgađanje izvođenje koda; vraća 'obećanje' koje se rješava za n milisekundi
const wait = (n) => new Promise((resolve) => setTimeout(resolve, n));

//pomoćne globalne varijable za praćenje vremena i kraj igre
let countElapsedTime = true;
let startTime = null;
let isGameOver = false;

//Širina i visina canvasa prilagođava se ekranu
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Funkcija za generiranje slučajno odabrane nijanse sive boje
function generateGrayShade() {
    const randomValue = Math.floor(Math.random() * 256);
    const grayValue = randomValue.toString(16).padStart(2, '0');
    const grayColor = `#${grayValue}${grayValue}${grayValue}`;
    return grayColor;
}

//Klasa osnovnog entiteta u igri
//Entity predstavlja asteroida
class Entity {
    constructor({ position, velocity, width, height, color }) {
        this.position = position;
        this.velocity = velocity;
        this.width = width;
        this.height = height;
        this.color = generateGrayShade();
    }

    //Metoda kojom se crta novi asteroid
    draw() {
        context.save();
        context.fillStyle = this.color;
        context.shadowBlur = 10;
        context.shadowColor = "black";
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
        context.strokeStyle = "black";
    }

    //Metoda koja ažurira kretanje asteroida
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

//Klasa koja nasljeđuje klasu Entity i predstavlja igrača
class Player extends Entity {
    constructor({ position, velocity, width, height, color }) {
        super({ position, velocity, width, height, color, });
    }

    //Metoda kojom se crta igrač
    draw() {
        context.save();
        context.beginPath();
        context.fillStyle = "darkred";
        context.shadowBlur = 10;
        context.shadowColor = "black";
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    //Metoda koja ažurira kretanje igrača
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

// Inicijalno postavljanje igrača na centar canvasa
// Igrač je tamnocrveni kvadrat 80x80
const player = new Player({
    position: { x: canvas.width / 2 - 40, y: canvas.height / 2 - 40 },
    velocity: { x: 0, y: 0 },
    width: 80,
    height: 80,
    color: 'darkred',
});

//Pomoćni objekt za praćenje pritisnutih strelica na tipkovnici
const keys = {
    Down: { pressed: false },
    Up: { pressed: false },
    Left: { pressed: false },
    Right: { pressed: false },
};

//Niz za pohranu asteroida
const asteroids = [];

//Funkcija za kreiranje novog asteroida (pravokutnika slučajno odabrane visine i širine)
function createAsteroid() {
    //Raspon i minimalna brzina kretanja asteroida
    const speedRange = 2;
    const minSpeed = 1;

    //Slučajno odabrane visina i širina asteroida
    const width = 80 * Math.random() + 40;
    const height = 80 * Math.random() + 40;

    //Isključeni dio širine i visine ekrana
    const excludedWidth = canvas.width / 8;
    const excludedHeight = canvas.height / 8;

    //Pomoćna varijabla za switch dio kojom se generira slučajan broj od 0 do 3
    const index = Math.floor(Math.random() * 4)

    //pomoćne varijable za poziciju asterioda i njegov položaj brzine
    let x, y;
    let vx, vy;

    //kut u radijanima
    let angleInRadians = 0;

    //Slučajno odabrana brzina kretanja asteroida
    const speed = Math.random() * speedRange + minSpeed;

    //Na temelju pomoćne varijable index odabire se strana ekrana na kojoj će se generirati novi asteroid
    //Za odabranu stranu postavljaju se početna pozicija asteroida izvan ekrana te se računa kut iz prilagođenog raspona
    //čiji će sinus i kosinus postavljeni na komponente brzine vx i vy omogućiti vidljivo kretanje asteroida po ekranu
    switch (index) {
        case 0: //lijeva strana
            angleInRadians = Math.random() * (Math.PI / 2) + (7 * Math.PI / 4);
            x = 0 - width
            y = Math.random() * (canvas.height - 2 * excludedHeight) + excludedHeight;
            vx = Math.cos(angleInRadians) * speed;
            vy = Math.sin(angleInRadians) * speed;
            break
        case 1: //donja strana
            angleInRadians = Math.random() * (Math.PI / 2) + (5 * Math.PI / 4);
            x = Math.random() * (canvas.width - 2 * excludedWidth) + excludedWidth;
            y = canvas.height + height
            vx = Math.cos(angleInRadians) * speed;
            vy = Math.sin(angleInRadians) * speed;
            break
        case 2: //desna strana
            angleInRadians = Math.random() * (Math.PI / 2) + (3 * Math.PI / 4);
            x = canvas.width + width
            y = Math.random() * (canvas.height - 2 * excludedHeight) + excludedHeight;
            vx = Math.cos(angleInRadians) * speed;
            vy = Math.sin(angleInRadians) * speed;
            break
        case 3: //gornja strana
            angleInRadians = Math.random() * (Math.PI / 2) + Math.PI / 4;
            x = Math.random() * (canvas.width - 2 * excludedWidth) + excludedWidth;
            y = 0 - height
            vx = Math.cos(angleInRadians) * speed;
            vy = Math.sin(angleInRadians) * speed;
            break
    }

    //dodavanje novog generiranog asteroida u niz asteroids
    asteroids.push(new Entity({ position: { x, y }, velocity: { x: vx, y: vy }, width, height }));
}

//postavljanje intervala kojim se svakih 1,3 sekundi generira novi asteroid
const intervalId = window.setInterval(createAsteroid, 1300);

//Funkcija kojom se detektira sudar igrača i asteroida na temelju preklapanja njihovih pozicija
function playerAsteroidCollision(rectangle1, rectangle2) {
    const xDifference = Math.abs(rectangle2.position.x + rectangle2.width / 2 - (rectangle1.position.x + rectangle1.width / 2));
    const yDifference = Math.abs(rectangle2.position.y + rectangle2.height / 2 - (rectangle1.position.y + rectangle1.height / 2));

    const xOverlap = rectangle1.width / 2 + rectangle2.width / 2 - xDifference;
    const yOverlap = rectangle1.height / 2 + rectangle2.height / 2 - yDifference;

    if (xOverlap > 0 && yOverlap > 0) {
        countElapsedTime = false;
        return true;
    };
    return false;
}

//Funkcija koja omogućuje da se igrač vrati s druge strane ekrana ukoliko izađe izvan ekrana
function wrapAroundPlayer() {
    if (player.position.x > canvas.width) {
        player.position.x = 0 - player.width;
    } else if (player.position.x < 0 - player.width) {
        player.position.x = canvas.width;
    }

    if (player.position.y > canvas.height) {
        player.position.y = 0 - player.height;
    } else if (player.position.y < 0 - player.height) {
        player.position.y = canvas.height;
    }
}

// Postavljanje najboljeg vremena: Dohvaćanje vrijednosti iz localStoragea ukoliko već postoji, inače 0
let theBestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0;

//Funkcija za formatirani ispis vremena na ekranu
function formatTime(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time / 1000) % 60);
    const milliseconds = (time % 1000).toString().padStart(3, '0');
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
}

//Funkcija za prikaz vremena i najboljeg vremena na canvasu
function showTime(elapsedTime, theBestTime) {
    const formattedElapsedTime = formatTime(elapsedTime);
    const formattedBestTime = formatTime(theBestTime);

    context.fillStyle = 'black';
    context.font = '20px Arial';
    context.textAlign = 'right';
    context.shadowColor = 'white';

    context.fillText(
        `Vrijeme: ${formattedElapsedTime}`,
        canvas.width - 10,
        30
    );

    context.fillText(
        `Najbolje vrijeme: ${formattedBestTime}`,
        canvas.width - 10,
        60
    );
}

//Funkcija s inicijalnim postavkama za ponovno pokretanje igre
function resetGame() {
    startTime = null;
    theBestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0;
    location.reload();

    intervalId = setInterval(createAsteroid, 2000);
    animate();
}

//Funkcija za prikaz prozorčića za ponovno pokretanje igre
function showRestartPopup() {
    if (!isGameOver) {
        isGameOver = true;
        if (window.confirm('KRAJ IGRE! Želiš li igrati ponovno?')) {
            resetGame();
        }
    }
}

//Pomoćna funkcija pri završetku igre
function endGame(elapsedTime) {
    countElapsedTime = false;
    //Provjera je li vrijeme trenutno odigrane igre najbolje vrijeme ikada
    if (elapsedTime > theBestTime && countElapsedTime === false) {
        theBestTime = elapsedTime;
        localStorage.setItem('bestTime', theBestTime);
    }
    showRestartPopup();
}

//Funkcija animate koja provodi animaciju, odnosno kontrolu igre
function animate() {
    const animationId = window.requestAnimationFrame(animate); //Metoda kojom pretraživaču govorimo da ćemo izvesti animaciju, a on zatim svake sekunde zove funkciju animate
    
    //Postavke canvasa
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    //Postavke trenutnog vremena za praćenje vremena igranja igre
    const currentTime = Date.now();
    const elapsedTime = startTime ? currentTime - startTime : 0;
    countElapsedTime = true;

    //Pozivi funkcija koje je potrebno zvati kontinuirano: prikaz vremena, ažuriranje kretanja igrača i provjera je li igrač izašao izvan ekrana
    showTime(elapsedTime, theBestTime);
    player.update();
    wrapAroundPlayer();

    //Kontrola generiranih asteroida
    //Niz asteroids ograničen je na 15 asteroida, prošli asteroidi se brišu
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.update();

        if (asteroids.length > 15) {
            asteroids.splice(0, asteroids.length - 15);
        }

        //Provjera je li došlo do sudara igrača i asteroida
        if (playerAsteroidCollision(player, asteroid)) {
            crashAudio.play(); //generiranje zvuka sudara
            countElapsedTime = false;
            //Pomoćna funkcija za odgađanje izvođenja koda 0,1 sekundu
            const waitTime = async () => {
                await wait(100);
                endGame(elapsedTime); //Poziv kraja igre
            };
            waitTime();
            clearInterval(intervalId); //Brisanje intervala
            window.cancelAnimationFrame(animationId); //Prekid animacije
        }
    }

    //Promjena smjera brzine na temelju pritisnute strelice na tipkovnici
    if (keys.Down.pressed) {
        player.velocity.x = 0;
        player.velocity.y = 1;
    } else if (keys.Up.pressed) {
        player.velocity.x = 0;
        player.velocity.y = -1;
    } else if (keys.Left.pressed) {
        player.velocity.x = -1;
        player.velocity.y = 0;
    } else if (keys.Right.pressed) {
        player.velocity.x = 1;
        player.velocity.y = 0;
    }
    else {
        player.velocity.x = 0;
        player.velocity.y = 0;
    }
}

//Slušatelj pritisnutih strelica na tipkovnici
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowDown':
            keys.Down.pressed = true
            break;
        case 'ArrowUp':
            keys.Up.pressed = true
            break;
        case 'ArrowLeft':
            keys.Left.pressed = true
            break;
        case 'ArrowRight':
            keys.Right.pressed = true
            break;
    }
});

//Slušatelj nepritisnutih strelica na tipkovnici
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowDown':
            keys.Down.pressed = false;
            break;
        case 'ArrowUp':
            keys.Up.pressed = false;
            break;
        case 'ArrowLeft':
            keys.Left.pressed = false;
            break;
        case 'ArrowRight':
            keys.Right.pressed = false;
            break;
    }
});

//Slušatelj učitavanja
//Nakon učitavanja postavlja se početno vrijeme i započinje igra
window.addEventListener('load', () => {
    if (!startTime) {
        startTime = Date.now();
        animate();
    }
});
