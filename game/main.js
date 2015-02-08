
var game = new Phaser.Game(288, 505, Phaser.AUTO, 'singleguy');

Boot = function(){

};

Boot.prototype = {
    preload: function(){
        this.load.image('preloader','preloader.gif');
    },

    create: function(){
        this.input.maxPointers = 1;
        this.stage.disableVisibilityChange = false;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.minWidth = 270;
        this.scale.minHeight = 480;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.stage.forcePortrait = true;
        this.scale.setScreenSize(true);

        this.input.addPointer();

        this.state.start('preload');
    }
};

Preload = function(){
    this.ready = false;
};

Preload.prototype = {
    preload: function(){
        this.asset = this.add.sprite(this.width/2,this.height/2, 'preloader');
        this.asset.anchor.setTo(0.5, 0.5);

        this.load.image('background', 'assets/background.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('title', 'assets/title.png');

        this.load.image('instructions', 'assets/instructions.png');
        this.load.image('getReady', 'assets/get-ready.png');

        this.load.spritesheet('bird', 'assets/bird.png', 34,24,3);
        this.load.spritesheet('pipe', 'assets/pipes.png', 54,320,2);

        this.load.image('startButton', 'assets/start-button.png');
        //Utilities

        //Audio

        //Font
    },

    create: function(){
        this.asset.cropEnabled = false;

    },

    update: function(){
        this.ready = true;
        this.state.start('menu');
    }
};

Menu = function(){

};

Menu.prototype = {
    preload: function() {

    },

    create: function() {
        this.background = this.game.add.sprite(0,0,'background');

        // add the ground sprite as a tile
        // and start scrolling in the negative x direction
        this.ground = this.game.add.tileSprite(0,400, 335,112,'ground');
        this.ground.autoScroll(-200,0);

        this.titleGroup = this.add.group();
        this.title = this.game.add.sprite(0,0,'title');
        this.bird = this.game.add.sprite(200,5,'bird');
        this.titleGroup.add(this.title);
        this.titleGroup.add(this.bird);

        this.titleGroup.x = 30;
        this.titleGroup.y = 100;

        this.bird.animations.add('flap');
        this.bird.animations.play('flap', 6, true);

        this.add.tween(this.titleGroup).to({y:115}, 300, Phaser.Easing.Linear.NONE, true, 0, 1000, true);

        this.startButton = this.game.add.button(this.world.centerX, 300, 'startButton', this.startClick, this);
        this.startButton.anchor.setTo(0.5,0.5);
    },

    update:function(){

    },

    startClick:function(){
        this.state.start('play');
    }
};


Play = function(){

};

Play.prototype = {
    preload: function(){

    },

    create: function(){
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = 1200;

        this.background = this.game.add.sprite(0,0,'background');

        this.bird = new Bird(this.game,100,this.world.halfHeight,3);
        this.game.add.existing(this.bird);
        this.ground = new Ground(this.game, 0,505-112, 335, 112);
        this.game.add.existing(this.ground);

        this.game.input.onDown.add(this.bird.flap, this.bird);

        this.pipeGenerator = this.game.time.events.loop(Phaser.Timer.SECOND * 1.25, this.generatePipes,this);
        this.pipeGenerator.timer.start();


    },

    update: function(){
        this.game.physics.arcade.collide(this.bird, this.ground);


    },

    generatePipes: function(){
        var pipeY = this.game.rnd.integerInRange(-100,100);
       var pipeGroup = new PipeGroup(this.game,this.pipes);
        pipeGroup.x = this.game.width;
        pipeGroup.y = pipeY;
    }
};

var Bird = function(game,x,y,frame){
    Phaser.Sprite.call(this, game, x, y, 'bird', frame);
    this.anchor.setTo(0.5, 0.5);
    this.animations.add('flap');
    this.animations.play('flap', 12, true);

    this.game.physics.arcade.enableBody(this);
};

Bird.prototype = Object.create(Phaser.Sprite.prototype);
Bird.prototype.constructor = Bird;

Bird.prototype.flap = function(){
    this.body.velocity.y = -400;
    this.game.add.tween(this).to({angle:-40}, 100).start();
};

Bird.prototype.update = function(){
    if(this.angle < 90){
        this.angle += 2.5;
    }
};
var Ground = function(game,x,y,width,height){
    Phaser.TileSprite.call(this,game,x,y,width,height,'ground');

    this.game.physics.arcade.enableBody(this);
    this.body.allowGravity = false;
    this.body.immovable = true;
    this.autoScroll(-200,0);

};

Ground.prototype = Object.create(Phaser.TileSprite.prototype);
Ground.prototype.constructor = Ground;

var Pipe = function(game,x,y,frame){
    Phaser.Sprite.call(this, game, x,y,'pipe',frame);
    this.anchor.setTo(0.5,0.5);
    this.game.physics.arcade.enableBody(this);

    this.body.allowGravity = false;
    this.body.immovable = true;
};

Pipe.prototype = Object.create(Phaser.Sprite.prototype);
Pipe.prototype.constructor = Pipe;

var PipeGroup = function(game,parent){
    Phaser.Group.call(this, game, parent);

    this.topPipe = new Pipe(this.game,0,0,0);
    this.add(this.topPipe);

    this.botPipe = new Pipe(this.game,0,440,1);
    this.add(this.botPipe);

    this.setAll('body.velocity.x', -200);
};

PipeGroup.prototype = Object.create(Phaser.Group.prototype);
PipeGroup.prototype.constructor = PipeGroup;



game.state.add('boot', Boot);
game.state.add('preload', Preload);
game.state.add('menu', Menu);
game.state.add('play', Play);

game.state.start('preload');