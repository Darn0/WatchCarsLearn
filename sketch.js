var brain = null;
let runBest = false;

let showNothing = true;
let replayGen = true;

let population;
let GLOBALSPEED = 1;
let startEvolution = false;
var zoom = 1;
var maxZoom = 7;
var zoomCar;
let buffer = 50;
let drawRays = false;
let screenshot = false;

var steerImg;

var NIGHTMODE;
var MAINCANVAS;

var numRaysPara;

var genPara;
var replayGenTutorialPara;
var showEvolutionPara;
var humanPlayingPara;

var raySlider;



var NNCanvas = function(can){
    let canvas;
    let outputs = ["POWER", "STEER"]
    can.setup = function(){
        canvas = can.createCanvas(Genome.drawDimensions+buffer, Genome.drawDimensions);
        canvas.position(width-Genome.drawDimensions-buffer, height-Genome.drawDimensions)
        let canvasPara = createP('');
        canvasPara.position(width-Genome.drawDimensions/2-buffer/2, height-Genome.drawDimensions/2)
        canvasPara.attribute('aria-label', "Visualisation of the Neural Network of the best player");
        canvasPara.attribute('data-balloon-pos', "left");
        canvasPara.addClass('tutorialImages');
    }

    // can.windowResized = function(){
    //     Genome.drawDimensions = width < 600 ? 200 : 300; 
    //     Genome.drawRadius = width < 600 ? 6 : 12; 
    //     can.createCanvas(Genome.drawDimensions+buffer, Genome.drawDimensions);
    //     canvas.position(width-Genome.drawDimensions-buffer, height-Genome.drawDimensions)
    // }

    can.draw = function () {
        can.clear();

        if(brain != null){
            brain.computeDrawCoordinates();
            let xOffset = buffer/2;
            let yOffset = 0;

            can.push();
            for(let c of brain.connections.values()){
                can.push();
                can.strokeWeight(c.weight*3)
                if(c.isEnabled()){
                    can.stroke(0,255,0)
                }else{
                    can.stroke(255, 0, 0);
                }
                can.line(brain.nodes.get(c.inNode).vector.x + xOffset, 
                brain.nodes.get(c.inNode).vector.y+yOffset, 
                brain.nodes.get(c.outNode).vector.x + xOffset, 
                brain.nodes.get(c.outNode).vector.y+yOffset)
                can.pop();
            }
            can.pop();
            can.push();

            let rayNo = 1;
            let outputNo = 0;
            can.stroke(0+NIGHTMODE*255);
            can.strokeWeight(0.2);
            for(let n of brain.nodes.values()){
                can.push();
                can.noStroke();
                can.fill(0+NIGHTMODE*255);
                can.textAlign(RIGHT, CENTER);
                if(n.type == "BIAS"){
                    can.text("BIAS", n.vector.x+xOffset-buffer/4, n.vector.y);
                }else if(n.type == "INPUT"){
                    can.text("RAY"+rayNo, n.vector.x+xOffset-buffer/4, n.vector.y);
                    rayNo++;
                }else if(n.type == "OUTPUT"){
                    can.textAlign(LEFT, CENTER);
                    can.text(outputs[outputNo], n.vector.x+xOffset+buffer/4, n.vector.y);
                    outputNo++;
                }
                can.pop();
                can.push();
                can.translate(n.vector.x + xOffset, n.vector.y+yOffset)
                can.fill(0)
                can.ellipse(0,0, n.radius,  n.radius);
                can.fill(255, 255, 255, Math.abs(1-n.drawOutput - NIGHTMODE)*255);
                can.ellipse(0,0, n.radius,  n.radius);
                can.pop();
            }
            can.pop();
            if(screenshot){
                can.saveCanvas(canvas, 'NN', 'png');
            }
        }
    };
}

var fitnessCanvas = function(can){
    var offset = 50;
    var canvas;

    can.setup = function(){
        canvas = can.createCanvas(Species.drawWidth, Species.drawHeight);
        canvas.position(0, windowHeight-Species.drawHeight);

        let canvasPara = createP('');
        canvasPara.position(Species.drawWidth/2, windowHeight-Species.drawHeight/2);
        canvasPara.attribute('aria-label', "Graph of fitness over generations");
        canvasPara.attribute('data-balloon-pos', "right");
        canvasPara.addClass('tutorialImages');
    }

    // can.windowResized = function(){
    //     Species.drawWidth = width < 600 ? 100 : 150;
    //     Species.drawHeight = height < 500 ? 150 : 300;
    //     createCanvas(Species.drawWidth, Species.drawHeight);
    //     canvas.position(0, windowHeight-Species.drawHeight);
        
    // }

    can.draw = function(){

        if(population.gen > 0){
            can.clear();
            can.strokeWeight(0.1);
            can.stroke(0+255*NIGHTMODE);
            can.fill(0+255*NIGHTMODE);

            can.textSize(15);
            can.text("Generations", Species.drawWidth/2-offset/2, Species.drawHeight-offset/4);
            can.push()
            can.translate(3*offset/8, Species.drawHeight/2+3*offset/4);
            can.rotate(-Math.PI/2);
            can.text("Fitness", 0,0);
            can.pop();

            can.push();
            can.textSize(12);
            can.textAlign(RIGHT);
            for(let i = Species.drawHeight-offset+10; i >= offset; i-=(Species.drawHeight-2*offset)/10){
                can.push();
                can.text((Species.drawHeight-offset+10-i)/(Species.drawHeight-2*offset), offset-5, i);
                can.pop();
            }
            can.pop();

            can.push();
            can.strokeWeight(2);
            can.line(offset-1, offset+1, offset-1, Species.drawHeight-offset+1)
            can.line(offset-1, Species.drawHeight-offset+1, Species.drawWidth-1, Species.drawHeight-offset+1)
            can.pop();
            let genX = offset;
            let genOffset = 10;
            let start = 0;
            if(genOffset*population.replayGenerations.length > (Species.drawWidth-offset)){
                start = population.replayGenerations.length - ((Species.drawWidth-offset)/genOffset);
            }   

            for(let i = start; i <  population.replayGenerations.length; i++){
                let rg = population.replayGenerations[i];
                for(let s of rg.species){
                    push();
                    can.noStroke();
                    can.fill(s.color);
                    can.rect(genX, (Species.drawHeight-offset)-s.bestFitness*(Species.drawHeight-2*offset), genOffset, (s.bestFitness*(Species.drawHeight-2*offset)), 20, 20, 0, 0);
                    pop();
                }
                genX += genOffset;
            }

            if(screenshot){
                can.saveCanvas(canvas, 'Graph', 'png');
                screenshot = false;
            }
        }
    }
}


new p5(fitnessCanvas, "fitnessCanvas")
new p5(NNCanvas, "NNCanvas");



function start(el){
    startEvolution = !startEvolution;
    console.log(el.classList);
    if(startEvolution){
        el.setAttribute('class','reset');
        el.setAttribute('aria-label','Reset the environment');
        carSettings = [localCar.pos.x, localCar.pos.y, localCar.angle];
        localStorage.setItem("carSettings", JSON.stringify(carSettings));
       
        toggleNightMode();
        humanPlaying = false;
    }else{
        el.setAttribute('class', '');
        el.setAttribute('aria-label','Start evolution');
        population = new Population(populationSize, raySlider.value(), 2);
        startEvolution = false;
        humanPlaying = true;
        brain = null;
    }
}


function toggleHumanPlayer(){
    humanPlaying = !humanPlaying;
}

function toggleShow(){
    showNothing = !showNothing;
}

function toggleBest(){
    if(population.best){
        startEvolution = !startEvolution;
        runBest = !runBest;
        if(runBest){
            population.best.reset();
        }
    }
}

function toggleReplay(){
    replayGen = !replayGen;
}

function zoomInCanvas(){
    if(zoom < maxZoom){
        zoom++;
    }
}

function zoomOutCanvas(){
    if(zoom > 1){
        zoom--;
    }
}

function clearScreen(){
    clear();
    if(NIGHTMODE)
        background('#000');
    else
        background('#eee');
    displayTracks();
}

// function windowResized(){
//     createCanvas(window.innerWidth, window.innerHeight);
//     clearScreen();
// }


function changeTheme(){
    NIGHTMODE = !NIGHTMODE;
    localStorage.setItem('nightMode', NIGHTMODE)
    clearScreen();
    toggleNightMode();
}

function toggleNightMode(){
    if(NIGHTMODE){
        Array.from(document.getElementsByTagName('button')).map(x => x.classList.add('nightMode'));
        document.getElementsByTagName('body')[0].classList.add('bodyNightMode');
    }else{
        Array.from(document.getElementsByTagName('button')).map(x => x.classList.remove('nightMode'));
        document.getElementsByTagName('body')[0].classList.remove('bodyNightMode');
    }
}


function setup() {
    MAINCANVAS = createCanvas(windowWidth, windowHeight);
    select('html').style('width', windowWidth+'px');
    select('html').style('height', windowHeight+'px');
    select('body').style('width', windowWidth+'px');
    select('body').style('height', windowHeight+'px');

    let storedCarSettings = JSON.parse(localStorage.getItem("carSettings"))
    carSettings = storedCarSettings == null ? [width/2, height/2, 0] : [storedCarSettings[0], storedCarSettings[1], storedCarSettings[2]];

    let storedPaths = JSON.parse(localStorage.getItem("paths"));
    paths = storedPaths == null ? [] : storedPaths.map(x => new Boundary(x.x1, x.y1, x.x2, x.y2));

    let storedInnerTrack = JSON.parse(localStorage.getItem("innerTrack"));
    innerTrack = storedInnerTrack == null ? [] : storedInnerTrack.map(x => new Boundary(x.x1, x.y1, x.x2, x.y2));

    let storedOuterTrack = JSON.parse(localStorage.getItem("outerTrack"));
    outerTrack = storedOuterTrack == null ? [] : storedOuterTrack.map(x => new Boundary(x.x1, x.y1, x.x2, x.y2));

    let storedCheckpoints = JSON.parse(localStorage.getItem("checkpoints"));
    checkpoints = storedCheckpoints == null ? [] : storedCheckpoints.map(x => new Boundary(x.x1, x.y1, x.x2, x.y2));

    raySlider = createSlider(1, 8, 3);
    raySlider.position(10, 230);
    raySlider.style('width', '80px');


    humanPlayingPara = createP('');
    humanPlayingPara.style('width', '20px');
    humanPlayingPara.style('height', '20px');
    humanPlayingPara.style('padding', '0px');
    humanPlayingPara.style('margin', '0px');
    humanPlayingPara.style('z-index', '2');
    humanPlayingPara.style('transform', 'translate(-10px, -10px)');

    humanPlayingPara.attribute('aria-label', "This is YOU. Toggle control by pressing P. Control your car with WASD or arrow keys. Control the start position of evolution by driving around.");
    humanPlayingPara.attribute('data-balloon-length', "xlarge");
    humanPlayingPara.attribute('data-balloon-pos', "down-left");
    humanPlayingPara.addClass('tutorial');

    genPara = createP("Replaying Gen: -");
    genPara.position(10, 120);
    genPara.attribute('aria-label', "The generation no. being replayed");
    genPara.attribute('data-balloon-pos', "down-left");
    genPara.addClass('tutorial');

    showEvolutionPara = createP("Current Gen: -");
    showEvolutionPara.position(10, 160);
    showEvolutionPara.attribute('aria-label', "The current generation evolving");
    showEvolutionPara.attribute('data-balloon-pos', "down-left");
    showEvolutionPara.addClass('tutorial');

    numRaysPara = createP("Inputs: "+raySlider.value());
    numRaysPara.id('numRaysPara');
    numRaysPara.position(10, 200);
    numRaysPara.attribute('aria-label', "Change number of inputs");
    numRaysPara.attribute('data-balloon-pos', "down-left");
    numRaysPara.addClass('tutorial');

    replayGenTutorialPara = createP('');
    replayGenTutorialPara.attribute('aria-label', "These are the champions of the species of the prevous generation. Hover over the species champions to reveal their brains");
    replayGenTutorialPara.attribute('data-balloon-length', "xlarge");
    replayGenTutorialPara.addClass('tutorial');
    replayGenTutorialPara.style('width', '20px');
    replayGenTutorialPara.style('height', '20px');
    replayGenTutorialPara.style('padding', '0px');
    replayGenTutorialPara.style('margin', '0px');
    replayGenTutorialPara.style('z-index', '1');
    replayGenTutorialPara.style('transform', 'translate(-10px, -10px)');
    replayGenTutorialPara.position(0,0);

    raySlider.changed(function(){
        drawRays = false;
        raySlider.elt.blur();
        reset();
    });


    population = new Population(populationSize, raySlider.value(), 2);
    localCar = new Car(raySlider.value(), 2);
    zoomCar = localCar;

    steerImg = select('#steering');

    NIGHTMODE = JSON.parse(localStorage.getItem("nightMode"));
    toggleNightMode();
    clearScreen();
    setTimeout(update, 1000/frameRate());
}

let lastTime = Date.now();

const step = 100;

function update(){
    const ms = Date.now();
    let dt = ms - lastTime;
    if (dt > 0) {
        
        if(dt > step){
            lastTime += dt-step;
            dt = step;
        }

        if(humanPlaying){
            localCar.update(dt/1000);
            steerImg.style('transform', 'rotate('+degrees(localCar.steerAngle)*10+'deg)')
        }

        evolve(dt/1000);
            
        lastTime = ms;
    }
    if(humanPlaying && localCar){
        localCar.isThrottling = keyActive('up');
        localCar.isReversing = keyActive('down');
        
        localCar.isTurningLeft = keyActive('left');
        localCar.isTurningRight = keyActive('right');


        if (localCar.pos.x > width) {
            localCar.pos.x -= width;
        } else if (localCar.pos.x < 0) {
            localCar.pos.x += width;
        }
        
        if (localCar.pos.y > height) {
            localCar.pos.y -= height;
        } else if (localCar.pos.y < 0) {
            localCar.pos.y += height;
        }

        zoomCar = localCar;
        if(startEvolution){
            localCar.look();
        }

        if(localCar.dead)
            localCar.reset();

    }
    setTimeout(update, 1000/frameRate());

}

function evolve(dt){
    if(startEvolution && population.gen < 1000){
        for(let car of population.population){
            if(!car.dead){
                calculateCheckpoints(car);
                car.look();
                car.think();
                car.update(dt);
                car.checkStaleness();
            }
        }
        if(population.done()){
            population.naturalSelection();
            showEvolutionPara.html("Current Gen: "+population.gen);
        }
    }

    if(runBest && population.best){
        if(!population.best.dead){
            calculateCheckpoints(population.best);
            population.best.look();
            population.best.think();
            population.best.update(dt);
            population.best.checkStaleness();
        }
    }

    if(startEvolution && population.replayGenerations.length > 0){
        let replayGeneration = population.replayGenerations[population.replayGenerationNo];

        if(!humanPlaying){
            zoomCar = replayGeneration.species[0].mascot;
        }
        for(let replaySpecies of replayGeneration.species){
            if(!replaySpecies.mascot.dead){
                calculateCheckpoints(replaySpecies.mascot);
                replaySpecies.mascot.look();
                replaySpecies.mascot.think();
                replaySpecies.mascot.update(dt);
                replaySpecies.mascot.checkStaleness();

            }
        }

        let replayDone = true;
        for(let replaySpecies of replayGeneration.species){
            if(!replaySpecies.mascot.dead){
                replayDone = false;
                break;
            }
        }
        if(replayDone){
            clearScreen();
            for(let replaySpecies of replayGeneration.species){
                replaySpecies.mascot.reset();
            }
            if(population.replayGenerations.length > population.replayGenerationNo+1){
                population.replayGenerationNo++;
            }
        }
        genPara.html("Replaying Gen: "+(population.replayGenerationNo+1));
        brain = replayGeneration.species[0].mascot.brain;
    }else{
        genPara.html("Replaying Gen: -");
    }
}


function draw() {
    if(zoom > 1 && zoomCar){
        translate(-zoom * zoomCar.pos.x+width/2, -zoom * zoomCar.pos.y+height/2);
        scale(zoom);
    }
    
    clearScreen();

    push();
    fill(0+NIGHTMODE*255);
    text(frameRate().toFixed(2), width-30, height-5);
    pop();

    if(keyIsDown(187) && GLOBALSPEED < 10){
        GLOBALSPEED += 1;
        frameRate(60+GLOBALSPEED)
    }

    if(keyIsDown(189) && GLOBALSPEED > 1){
        GLOBALSPEED -= 1;
        frameRate(60+GLOBALSPEED)
    }


    raySlider.input(() => {
        humanPlaying = true;
        drawRays = true;
        numRaysPara.html("Inputs: "+raySlider.value());
        localCar.changeNumRays(raySlider.value());

    });

    if(startEvolution && (population.gen == 0 || !showNothing)){
        for(let p of population.population)
            p.display(p.color);
    }

    if(runBest && population.best){
        population.best.display(population.best.color, true);
        zoomCar = population.best;
        brain = population.best.brain;
    }
    
    if(population.replayGenerations.length > 0 && startEvolution && replayGen){
        let tutorial = population.replayGenerations.length == 1;

        for(let replaySpecies of population.replayGenerations[population.replayGenerationNo].species){
            if(zoom > 1 && replaySpecies.mascot.isPointInside(Math.floor((mouseX-width/2+zoomCar.pos.x*zoom)/zoom), Math.floor((mouseY-height/2+zoomCar.pos.y*zoom)/zoom)))
                brain = replaySpecies.mascot.brain;
            else if(replaySpecies.mascot.isPointInside(mouseX, mouseY))
                brain = replaySpecies.mascot.brain;
            replaySpecies.mascot.display(replaySpecies.color);
        }
        let genMascot = population.replayGenerations[population.replayGenerationNo].species[0].mascot;
        let x = genMascot.pos.y < height/2 ? "down" : "up";
        let y = genMascot.pos.x < width/2 ? "left" : "right";
        if(tutorial){
            replayGenTutorialPara.attribute('data-balloon-visible', '');
            setTimeout(() => {replayGenTutorialPara.removeAttribute('data-balloon-visible')}, 200*replayGenTutorialPara.elt.getAttribute('aria-label').length)
        }

        replayGenTutorialPara.attribute('data-balloon-pos', x+"-"+y);
        replayGenTutorialPara.position(genMascot.pos.x, genMascot.pos.y);
    }

    if(humanPlaying && localCar){
        let x = localCar.pos.y < height/2 ? "down" : "up";
        let y = localCar.pos.x < width/2 ? "left" : "right";
        humanPlayingPara.attribute('data-balloon-pos', x+"-"+y);
        humanPlayingPara.position(localCar.pos.x, localCar.pos.y);
        localCar.display([230, 109, 100], drawRays);
    }
}

function keyPressed(e) {
    switch (e.keyCode) {
        case 71:
            replayGen = !replayGen;
            break;
        case 78:
            showNothing = !showNothing;
            break;
        case 66: 
            if(population.best){
                startEvolution = !startEvolution;
                runBest = !runBest;
                if(runBest){
                    population.best.reset();
                }
            }
            break;
        case 13:
            population.nextGen()
            break;
        case 80:
            humanPlaying = !humanPlaying;
            break;
        case 83:
            screenshot = true;
            break;
    }
}