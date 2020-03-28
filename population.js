class Population{
    constructor(size, inputs, outputs){
        this.populationSize = size;
        this.population = [];

        this.bestScore = 0;
        this.previousBest;
        this.innovationHistory = [];
        this.species = [];
        this.gen = 0;
        this.bestGen = 0;
        this.best = null;

        this.replayGenerations = [];
        this.replayGenerationNo = 0;

        this.bestPlayerDiv = createDiv('');
        this.bestPlayerDiv.addClass('best');

        this.playerDivs = [];
        this.replayDivs = [];

        for(let i = 0; i < this.populationSize; i++){
            let div = createDiv('');
            div.addClass('car');
            this.playerDivs[i] = div;
            this.population[i] = new Car(inputs, outputs);
            this.population[i].el = this.playerDivs[i];
            this.population[i].setUpDiv();
            this.population[this.population.length - 1].brain.fullyConnect(this.innovationHistory);
            this.population[this.population.length - 1].brain.mutate(this.innovationHistory);
        }

    }

    nextGen(){
        for(let p of this.population){
            if(!p.dead)
                p.died();
        }
    }

    done() {
        for (var i = 0; i < this.population.length; i++) {
            if (!this.population[i].dead)
                return false;
        }
        return true;
    }

    addReplayGen(){
        let replayGeneration = new ReplayGeneration();
        for(let s of this.species){
            replayGeneration.addSpecies(s.clone());
        }
        
        while(this.replayDivs.length < replayGeneration.species.length){
            let div = createDiv('');
            div.addClass('replay');
            this.replayDivs.push(div);
        }
        for(let i = 0; i < replayGeneration.species.length; i++){
            replayGeneration.species[i].mascot.el = this.replayDivs[i];
            replayGeneration.species[i].mascot.setUpDiv();
        }
        this.replayGenerations.push(replayGeneration);
    }

    setBestPlayer(){

        var tempBest = this.species[0].members[0];
    
        if (tempBest.score >= this.bestScore) {
          this.bestScore = tempBest.score;
          this.best = tempBest.cloneForReplay('best');
          this.best.el = this.bestPlayerDiv;
          this.best.setUpDiv();
          this.bestGen = this.gen+1;
          arrayCopy(this.species[0].color, this.best.color);
        }
        
    }

    naturalSelection(){
        this.speciate();
        this.calculateFitness();
        this.sortSpecies();
        
        this.addReplayGen();

        this.cullSpecies();
        
        this.setBestPlayer();
        this.killStaleSpecies();

        this.killBadSpecies();
        console.log("Gen: "+ this.gen + "  Number of Species: " + this.species.length  +" Best Score: "+this.population.reduce((max, p) => max.score > p.score ? max : p).score);
        // console.log(this.species[0].members[0].score);
        let averageSum = this.getAvgFitnessSum();
        let children = [];

        for(let s of this.species){

            children.push(s.mascot.clone());
            let noOfChildren = Math.floor(s.averageFitness/averageSum*this.population.length)-1;

            for(let i = 0; i < noOfChildren; i++){
                children.push(s.crossover(this.innovationHistory));
            }
        }

        if(children.length < this.populationSize){
            children.push(this.best.clone());
        }
        // console.log(score)
        while(children.length < this.populationSize){
            children.push(this.species[0].crossover(this.innovationHistory));
        }
        this.population = [];

        arrayCopy(children, this.population);

        for(let i = 0; i < this.population.length; i++){
            this.population[i].el = this.playerDivs[i];
            this.population[i].setUpDiv();
        }

        this.gen++;
    }

    cullSpecies(){
        for(let s of this.species){
            s.cull();
            s.fitnessSharing();
            s.calculateAverage();
        }
    }

    killBadSpecies() {
        var averageSum = this.getAvgFitnessSum();
  
        for (var i = 1; i < this.species.length; i++) {
            if (this.species[i].averageFitness / averageSum * this.populationSize < 1) { //if wont be given a single child
                // this.species.remove(i); //sad
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    noOfChildren(species){
        var averageSum = this.getAvgFitnessSum();
        return species.averageFitness / averageSum * this.population.length;
      }

    killStaleSpecies() {
        for (var i = 2; i < this.species.length; i++) {
            if (this.species[i].staleness >= 15) {
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    calculateFitness(){
        for(let p of this.population){
            p.calculateFitness();
        }
    }

    getAvgFitnessSum() {
        var averageSum = 0;
        for (var s of this.species) {
            averageSum += s.averageFitness;
        }
        return averageSum;
    }

    sortSpecies(){
        for(let s of this.species){
            s.sortSpecies();
        }
         //sort the this.species by the fitness of its best player

        this.species.sort((a,b) => a.bestFitness > b.bestFitness ? -1 : 1);

    }

    speciate(){
        for(let s of this.species){
            s.members = [];
        }
        for(let i = 0; i < this.populationSize; i++){
            let p = this.population[i];

            let createNewSpecies = true;
            for(let s of this.species){
                if(s.sameSpecies(p.brain)){
                    createNewSpecies = false;
                    s.addMember(p);
                }
            }
            if(createNewSpecies){
                this.species.push(new Species(p));
            }
        }
    }
}