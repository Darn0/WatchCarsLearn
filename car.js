class Car {
    
    constructor(inputs, outputs) {
        this.pos = createVector(carSettings[0], carSettings[1]);

        this.angle = carSettings[2],

        this.velocity = 0;
        this.acceleration = 0;
        this.steer = 0;
        this.steerAngle = 0;

        this.isThrottling = false,
        this.isReversing = false;
        this.isBraking = false;
        this.rays = [];
        this.corners = [];
        this.width = 20;
        this.height = 10;
        this.L = 3*this.width/4;
        this.borderRadius = 2;

        this.borders = [];
        this.dead = false;
        this.oldScore = 0;
        this.score = 0;
        this.fitness = 0;
        this.color = [70,70,70];


        if(inputs instanceof Genome){
            this.genomeInputs = inputs.numInputs;
            this.genomeOutputs = inputs.numOutputs;
            this.brain = inputs.clone();
        }else{
            this.genomeInputs = inputs;
            this.genomeOutputs = outputs;
            this.brain = new Genome(this.genomeInputs, this.genomeOutputs);
        }

    }

    reset(){
        this.pos = createVector(carSettings[0], carSettings[1]);
        this.angle = carSettings[2],
        this.velocity = 0;
        this.acceleration = 0;
        this.steer = 0;
        this.steerAngle = 0;
        this.isThrottling = false,
        this.isReversing = false;
        this.isBraking = false;
        this.corners = [];
        this.borders = [];
        this.dead = false;
        this.oldScore = 0;
        this.score = 0;
        this.staleness = 0;
        this.checkpoints = new Set();
        this.inputs = [];
        this.laps = 0;
        this.moves = 0;

    }

    think(inputs) {
        let predicts = this.brain.query(inputs);
        let indexOfMaxValue = predicts.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)
        return MOVES[indexOfMaxValue];
    }

    look(){
        if(this.moves > 100){
            this.oldScore = this.laps*checkpoints.length+this.checkpoints.size;
            this.moves = 0;
        }

        let boundaries = innerTrack.concat(outerTrack);
        
        let overlap = false;
        for(let b of boundaries){
            for(let border of this.borders){
                if(Boundary.overlaps(border, b)){
                    overlap = true;
                    break
                }
            }
            if(overlap){
                this.died();
                break;
            }
        }

        for(let ray of this.rays){
            ray.reset();
        }
        let raysDone = 0;
        for(let b of boundaries){
            for(let ray of this.rays){
                if(ray.done){
                    continue;
                }
                let int = ray.isHitting(b)
                let d = Infinity;
                if(int != null)
                    d = dist(ray.tail.x, ray.tail.y, int.x, int.y);
                if(int && d < ray.maxlength){
                    ray.setLength(d);
                    ray.done = true;
                    raysDone++;
                }
            }
            if(raysDone == this.numRays){
                break;
            }
        }
        this.inputs = this.rays.map(x => 1-x.length/x.maxlength);
    }

    think() {

        if(!this.dead){
            let outputs = this.brain.feedForward(this.inputs);

            this.isThrottling = outputs[0] >= 0.66;
            this.isReversing = outputs[0] < 0.33;
            this.isTurningLeft = outputs[1] >= 0.66;
            this.isTurningRight = outputs[1] < 0.33;
            this.moves++;
        }
    }

    applyFriction(fr = this.friction) {
        if (this.direction != 0) {
            let spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            let ang = Math.atan2(this.vy, this.vx);
            if (spd > fr)
                spd -= fr;
            else
                spd = 0;
            this.vx = Math.cos(ang) * spd;
            this.vy = Math.sin(ang) * spd;
            if (spd == 0) {
                console.log("dir zero")
                this.direction = 0;
            }
        }
    }


    goBackward() {
        let newX = this.x - this.speed * Math.cos(this.alpha);
        let newY = this.y - this.speed * Math.sin(this.alpha);
        this.x = newX;
        this.y = newY;
    }

    addCheckpoint(c){
        this.checkpoints.add(c);
        if(this.checkpoints.size == checkpoints.length){
            this.checkpoints = new Set();
            this.laps++;
            this.oldScore = 0;
        }
        this.score = this.checkpoints.size + this.laps*checkpoints.length;
    }

    computeRays(){
        let offsetAdd = this.numRays > 8 ? Math.PI/((this.numRays/8)*(4%this.numRays)) : Math.PI/4;
        let offset = this.numRays%2 == 0 ? -(this.numRays-1)*(offsetAdd/2) : -((this.numRays-1)/2)*offsetAdd;
        for (let i = 0; i < this.numRays; i++) {
            this.rays[i] = new Ray(createVector(this.pos.x, this.pos.y), this.angle+offset, 50);
            offset += offsetAdd;
        }
    }

    recomputeRays(){
        let offsetAdd = this.numRays > 8 ? Math.PI/((this.numRays/8)*(4%this.numRays)) : Math.PI/4;
        let offset = this.numRays%2 == 0 ? -(this.numRays-1)*(offsetAdd/2) : -((this.numRays-1)/2)*offsetAdd;
        for (let i = 0; i < this.numRays; i++) {
            this.rays[i].setTailAndHeading(this.pos.x, this.pos.y, this.angle+offset);
            offset += offsetAdd;
        }
        this.score = this.laps+(bestP/(path.length-1));
        if(this.score == this.laps+1)
            this.laps++;

    }
    
    changeNumRays(newNumRays){
        this.rays = [];
        this.numRays = newNumRays;
        this.computeRays();
    }
    
    recomputeCorners(){
         //top right
         let x = this.pos.x + this.width/2 * Math.cos(this.angle) - this.height/2 * Math.sin(this.angle)
         let y = this.pos.y + this.width/2 * Math.sin(this.angle) + this.height/2 * Math.cos(this.angle)
         this.corners[0] = createVector(x,y)
 
         //bottom right
         x = this.pos.x - this.width/2 * Math.cos(this.angle) - this.height/2 * Math.sin(this.angle)
         y = this.pos.y - this.width/2 * Math.sin(this.angle) + this.height/2 * Math.cos(this.angle)
         this.corners[1] = createVector(x,y)
 
         //bottom left
         x = this.pos.x - this.width/2 * Math.cos(this.angle) + this.height/2 * Math.sin(this.angle)
         y = this.pos.y - this.width/2 * Math.sin(this.angle) - this.height/2 * Math.cos(this.angle)
         this.corners[2] = createVector(x,y)
 
         //top left
         x = this.pos.x + this.width/2 * Math.cos(this.angle) + this.height/2 * Math.sin(this.angle)
         y = this.pos.y + this.width/2 * Math.sin(this.angle) - this.height/2 * Math.cos(this.angle)
         this.corners[3] = createVector(x,y)
 
        for(let i = 0; i < this.corners.length-1; i++){
            this.borders[i] = new Boundary(this.corners[i].x, this.corners[i].y, this.corners[i+1].x, this.corners[i+1].y)
        }
        this.borders[this.corners.length-1] = new Boundary(this.corners[0].x, this.corners[0].y, this.corners[this.corners.length-1].x, this.corners[this.corners.length-1].y)

    }
    
    turnCar() {
        this.alpha += this.velocity / this.r;
        this.x = this.turnCenterX + this.r * Math.sin(this.alpha);
        this.y = this.turnCenterY - this.r * Math.cos(this.alpha);
    }

    display(color = [70,70,70], drawRays = false) {
        // push()
        // stroke(255);
        // for(let r of this.rays){
        //     line(r.tail.x, r.tail.y, r.getPoint2().x, r.getPoint2().y);
        // }
        // pop();
        push();
        noStroke();
        fill(color[0], color[1], color[2]);
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        rectMode(CENTER);
        rect(0,0,this.width,this.height, 3);
        pop();

    }


    update(dt) {
        if(this.dead){
            return;
        }

        let throttle = this.isThrottling*Car.engineForce;
        let reverse = this.isReversing*Car.reverseForce;
        let sign = (this.velocity > 0 && this.isReversing)+((this.velocity < 0 && this.isThrottling)*-1)
        let braking = (Math.abs(this.velocity) < 0.5 ? 0 : 1)*sign*Car.brakingForce;

        let steerInput = 1*this.isTurningRight-1*this.isTurningLeft;

        if( Math.abs(steerInput) > 0.001 ){
            //  Move toward steering input
            this.steer = Math.min(Math.max(this.steer + steerInput * dt * 2.0, -1.0), 1.0); // -inp.right, inp.left);
        }
        else{
            //  No steer input - move toward centre (0)
            if( this.steer > 0 ){
                this.steer = Math.max(this.steer - dt * 1.0, 0);
            }
            else if( this.steer < 0 ){
                this.steer = Math.min(this.steer + dt * 1.0, 0);
            }
        }

        var avel = Math.min(Math.abs(this.velocity)/Car.scale, 250.0);  // m/s
        this.steer = this.steer * (1.0 - (avel / 280.0));
        
        this.steerAngle = this.steer*Car.maxSteer;

        let Ftraction = throttle-reverse-braking;

        let Fdrag = -Car.Cdrag*Math.abs(this.velocity)*this.velocity;
        let Frr = -Car.Crr*this.velocity;

        let Flong = Ftraction+ Fdrag+Frr;
        this.acceleration = Flong/Car.mass;
        this.velocity += this.acceleration*dt;

        if( Math.abs(this.velocity) < 0.5 && (!this.isThrottling && !this.isReversing)){
            this.velocity = 0;
        }
        let dist = this.velocity*dt;

        this.pos = p5.Vector.fromAngle(this.angle).mult(dist).add(this.pos);


        let R = this.L/Math.sin(this.steerAngle);
        let angularVelocity = this.velocity/R;
        this.angle += angularVelocity * dt;


        this.recomputeRays();
        this.recomputeCorners();
    }

}

Car.scale = 5;
Car.engineForce = 8000*Car.scale;
Car.reverseForce = 12000*Car.scale;
Car.brakingForce = Car.reverseForce+Car.reverseForce/2.5;
Car.Cdrag = 0.7;
Car.Crr = 0;

Car.mass = 1200;
Car.maxSteer = 0.6;
