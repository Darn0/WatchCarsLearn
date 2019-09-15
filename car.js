var CAR = new Image;
CAR.src = "car.png";

function randn_bm() {
    var u = 0,
        v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


function mutate(x) {
    if (Math.random() < 0.1) {
        let offset = randn_bm() * 0.5;
        let newx = x + offset;
        return newx;
    } else {
        return x;
    }
}

class Car {
    constructor(brain) {
        this.x = carStartX;
        this.y = carStartY;
        this.alpha = -Math.PI / 2;
        this.turnAngle = 0;
        this.turnAngleLeft = 0;
        this.turnAngleRight = 0;
        this.rays = [];
        this.direction = 0;
        this.turn = 0;
        this.score = 0;
        this.fitness = 0;
        this.prevAngle = -1;
        this.vision = 100;
        this.width = 40;
        this.height = 20;
        this.speed = 2;
        this.laps = 0;
        this.tyreWidth = this.width / 4;
        this.tyreHeight = this.height / 6;


        for (let i = -45 * Math.floor(numRays / 2); i <= 45 * Math.floor(numRays / 2); i += 45) {
            this.rays.push(new Ray(this.x, this.y, Math.PI * i / 180 + this.alpha));
        }

        if (brain instanceof NeuralNetwork) {
            this.brain = brain.copy();
            //            console.log("mutating");
            this.brain.mutate(mutate);
        } else {
            this.brain = new NeuralNetwork([this.rays.length, 4, 3, 3]);
        }
    }

    copyCar() {
        return new Car(this.brain);
    }

    think(inputs) {
        let predicts = this.brain.query(inputs);
        let indexOfMaxValue = predicts.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)
        let carMove = MOVES[indexOfMaxValue];
        this.moveCar(MOVES[indexOfMaxValue]);
        this.rayTrace();
    }

    rayTrace() {
        let i = -45 * Math.floor(numRays / 2);
        for (let ray of this.rays) {
            ray.x = this.x;
            ray.y = this.y;
            ray.setAngle(Math.PI * i / 180 + this.alpha);
            i += 45;
        }

        for (let ray of this.rays) {
            let dist = Infinity;
            let closestBoundary = null;
            let ray_dist;
            for (let boundary of boundaries) {
                let hit = ray.isHitting(boundary);
                if (hit) {
                    ray_dist = getDist(ray.x, ray.y, hit.x, hit.y);
                    if (ray_dist < dist) {
                        closestBoundary = hit;
                        dist = ray_dist;
                    }
                }
            }
            if (closestBoundary) {
                let tmp = getDist(ray.x, ray.y, closestBoundary.x, closestBoundary.y);
                if (tmp > this.vision) {
                    ray.distance = this.vision;
                } else {
                    ray.distance = getDist(ray.x, ray.y, closestBoundary.x, closestBoundary.y);
                }
            } else {
                ray.distance = this.vision;
            }

        }
    }

    goForward() {
        let newX = this.x + this.speed * Math.cos(this.alpha);
        let newY = this.y + this.speed * Math.sin(this.alpha);
        this.x = newX;
        this.y = newY;
    }

    goBackward() {
        let newX = this.x - this.speed * Math.cos(this.alpha);
        let newY = this.y - this.speed * Math.sin(this.alpha);
        this.x = newX;
        this.y = newY;
    }

    calculateScore() {
        let tmp = Math.atan2(this.y, this.x) - Math.PI;
        let angle = tmp;
        if (this.prevAngle - angle >= Math.PI) {
            angle = angle + 2 * Math.PI;
        }
        if (angle >= Math.PI * 2 - 0.01) {
            this.laps++;
        }
        this.score = angle + Math.PI * 2 * this.laps;
        this.prevAngle = angle - 1 / 720;
    }

    turnForward() {
        this.alpha += 1 / this.r;
        if (this.alpha >= Math.PI * 2 || this.alpha <= -Math.PI * 2)
            this.alpha = 0;
        if (this.alpha != 0) {
            let newX = this.x + Math.cos(this.alpha);
            let newY = this.y + Math.sin(this.alpha);
            this.x = newX;
            this.y = newY;
        }
        console.log(this.alpha)
    }


    turnBackward() {
        this.alpha -= 1 / this.r;
        if (this.alpha >= Math.PI * 2 || this.alpha <= -Math.PI * 2)
            this.alpha = 0;
        if (this.alpha != 0) {
            let newX = this.x - Math.cos(this.alpha);
            let newY = this.y - Math.sin(this.alpha);
            this.x = newX;
            this.y = newY;
        }
    }


    calculateTurnAngles() {
        let r = (this.width / 2) / Math.tan(this.turnAngle);
        this.turnAngleLeft = Math.atan((this.width / 2) / (r + this.height / 2))
        this.turnAngleRight = Math.atan((this.width / 2) / (r - this.height / 2))

        this.rLeft = r + this.height / 2;
        this.rRight = r - this.height / 2

        this.r = r * Math.cos(this.turnAngle / 2);
    }

    drawTurn() {
        context.beginPath()
        context.moveTo(this.x, this.y);
        context.lineTo(this.x - this.r * Math.sin(this.alpha), this.y + this.r * Math.cos(this.alpha))
        context.lineWidth = 2;
        context.strokeStyle = "purple";
        context.stroke();

        context.beginPath();
        context.arc(this.x - this.r * Math.sin(this.alpha), this.y + this.r * Math.cos(this.alpha), 4, 0, Math.PI * 2);
        context.fillStyle = "purple";
        context.fill();

        context.beginPath();
        context.arc(this.x - this.r * Math.sin(this.alpha), this.y + this.r * Math.cos(this.alpha), Math.abs(this.rLeft), 0, Math.PI * 2);
        context.strokeStyle = "rgba(255, 255, 102, 0.6";;
        context.stroke();

        context.beginPath();
        context.arc(this.x - this.r * Math.sin(this.alpha), this.y + this.r * Math.cos(this.alpha), Math.abs(this.rRight), 0, Math.PI * 2);
        context.strokeStyle = "rgba(255, 255, 102, 0.6";;
        context.stroke();
    }

    moveCar(move) {
        if (moveType == "ackerman") {
            this.moveCarAckerman(move);
        } else {
            this.turnAngle = 0;
            this.calculateTurnAngles();
            switch (move) {
                case "F":
                    this.goForward();
                    break;
                case "B":
                    this.goBackward();
                    break;
                case "R":
                    this.alpha += Math.PI / 45;
                    break;
                case "L":
                    this.alpha -= Math.PI / 45;
                    break;
                case "":
                    break;

            }
        }
        this.calculateScore();
    }

    moveCarAckerman(move) {

        switch (move) {
            case "F":
                if (this.turnAngle == 0) {
                    this.goForward();
                } else {
                    this.turnForward();
                }
                break;
            case "B":
                if (this.turnAngle == 0) {
                    this.goBackward();
                } else
                    this.turnBackward();
                break;
            case "R":
                if (this.turnAngle < Math.PI / 5)
                    this.turnAngle += Math.PI / 360;
                this.calculateTurnAngles();
                break;
            case "L":
                if (this.turnAngle > -Math.PI / 5)
                    this.turnAngle -= Math.PI / 360;
                this.calculateTurnAngles();
                break;
            case "":
                this.turnAngle = 0;
                //                if (Math.floor(this.turnAngle * 10) == 0) {
                //                    this.turnAngle = 0;
                //                    this.r = 0;
                //                } else if (this.turnAngle > 0)
                //                    this.turnAngle -= Math.PI / 180;
                //                else if (this.turnAngle < 0)
                //                    this.turnAngle += Math.PI / 180;
                break;
            case "reduceSpeed":
                if (Math.floor(this.speed * 100) == 0) {
                    this.speed = 0;
                }
                break;

        }
        this.calculateScore();
    }

    drawCar(style = "rgba(255, 0, 0, 0.4") {
        context.beginPath();
        context.translate(this.x, this.y);
        context.rotate(this.alpha);
        context.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        //        context.drawImage(CAR, -this.width / 2, -this.height / 2, this.width, this.height);
        context.fillStyle = style;
        context.fill();
        context.rotate(-this.alpha);
        context.translate(-this.x, -this.y);

        this.calculateTurnAngles();
        this.drawFrontWheels();
        this.drawBackWheels();
    }

    drawFrontWheels() {
        let lAng = Math.atan((this.height / 2) / (this.width / 4)) - this.alpha;
        let dist = Math.sqrt(Math.pow(this.width / 4, 2) + Math.pow(this.height / 2, 2));
        //Left wheel
        context.beginPath();
        context.translate(this.x + dist * Math.cos(lAng), this.y - dist * Math.sin(lAng));
        context.rotate(this.alpha + this.turnAngleLeft);
        //                context.arc(0,0,5,0,Math.PI*2);
        context.rect(-this.tyreWidth / 2, -this.tyreHeight / 2, this.tyreWidth, this.tyreHeight);
        //        context.drawImage(CAR, -this.width / 2, -this.height / 2, this.width, this.height);
        context.fillStyle = "blue";
        context.fill();
        context.rotate(-(this.alpha + this.turnAngleLeft));
        context.restore();
        context.translate(-(this.x + dist * Math.cos(lAng)), -(this.y - dist * Math.sin(lAng)));


        let rAng = Math.atan((this.height / 2) / (this.width / 4)) + this.alpha;
        //Right wheel
        context.beginPath();
        context.translate(this.x + dist * Math.cos(rAng), this.y + dist * Math.sin(rAng));
        context.rotate(this.alpha + this.turnAngleRight);
        //        context.arc(0,0,5,0,Math.PI*2);
        context.rect(-this.tyreWidth / 2, -this.tyreHeight / 2, this.tyreWidth, this.tyreHeight);
        //        context.drawImage(CAR, -this.width / 2, -this.height / 2, this.width, this.height);
        context.fillStyle = "blue";
        context.fill();
        context.rotate(-(this.alpha + this.turnAngleRight));
        context.restore();
        context.translate(-(this.x + dist * Math.cos(rAng)), -(this.y + dist * Math.sin(rAng)));

    }


    drawBackWheels() {
        //Left wheel
        context.beginPath();
        context.translate(this.x, this.y);
        context.rotate(this.alpha);
        //        context.arc(0,0,5,0,Math.PI*2);
        context.rect(-this.width / 4 - this.tyreWidth / 2, -this.height / 2 - this.tyreHeight / 2, this.tyreWidth, this.tyreHeight);
        //        context.drawImage(CAR, -this.width / 2, -this.height / 2, this.width, this.height);
        context.fillStyle = "blue";
        context.fill();
        context.rotate(-this.alpha);
        context.translate(-this.x, -this.y);


        //Right wheel
        context.beginPath();
        context.translate(this.x, this.y);
        context.rotate(this.alpha);
        //        context.arc(0,0,5,0,Math.PI*2);
        context.rect(-this.width / 4 - this.tyreWidth / 2, this.height / 2 - this.tyreHeight / 2, this.tyreWidth, this.tyreHeight);
        //        context.drawImage(CAR, -this.width / 2, -this.height / 2, this.width, this.height);
        context.fillStyle = "blue";
        context.fill();
        context.rotate(-this.alpha);
        context.translate(-this.x, -this.y);

    }

    drawRays() {
        for (let ray of this.rays) {
            drawLine(ray.x, ray.y, ray.x + ray.distance * Math.cos(ray.angle), ray.y + ray.distance * Math.sin(ray.angle), 0.3, 3)
            context.beginPath();
            context.arc(ray.x + ray.distance * Math.cos(ray.angle), ray.y + ray.distance * Math.sin(ray.angle), 4, 0, Math.PI * 2);
            context.fillStyle = "lightblue";
            context.fill();
        }
    }
}
