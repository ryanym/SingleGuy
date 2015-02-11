
var game = new Phaser.Game(288, 505, Phaser.AUTO, 'singleguy');
//var score = 0;

Boot = function(){

};

Boot.prototype = {
    preload: function(){
        this.load.image('preloader','assets/preloader.gif');
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
        this.load.image('title', 'assets/title.png');

        this.load.image('instructions', 'assets/instructions.png');
        this.load.image('getReady', 'assets/get-ready.png');

        this.load.spritesheet('dude', 'assets/dude.png', 20,30,1);
        this.load.spritesheet('couple', 'assets/couple.png', 40,30,1);

        this.load.image('startButton', 'assets/start-button.png');
        //Utilities

        //Audio

        //Font
        this.load.bitmapFont('flappyfont', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');
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
        //this.ground = this.game.add.tileSprite(0,400, 335,112,'ground');
        //this.ground.autoScroll(-200,0);

        this.titleGroup = this.add.group();
        this.title = this.game.add.sprite(0,0,'title');
        this.dude = this.game.add.sprite(20,30,'dude');
        this.titleGroup.add(this.title);
        this.titleGroup.add(this.dude);

        this.titleGroup.x = 30;
        this.titleGroup.y = 100;

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
        this.background = this.game.add.sprite(0,0,'background');
        this.dude = new Dude(this.game,this.world.centerX,400,3);
        this.game.add.existing(this.dude);
        this.couples = this.game.add.group();
        this.game.input.onDown.add(this.dude.fart, this.dude);
        this.coupleGenerator = this.game.time.events.loop(Phaser.Timer.SECOND, this.generateCouples,this);
        this.coupleGenerator.timer.start();

        this.game.time.events.loop(1000, this.updateScore,this);
        this.score = 0;
        this.scoreText = this.game.add.bitmapText(this.game.width/2, 10, 'flappyfont',this.score.toString(), 24);




    },

    update: function(){
        this.couples.forEach(function(couple) {
            this.game.physics.arcade.collide(this.dude, couple, this.deathHandler, null, this);
        }, this);
        this.scoreText.setText(this.score);
    },

    updateScore: function(){
        this.score++;
    },
    generateCouples: function(){
        var coupleX = this.game.rnd.integerInRange(20,268);
        var coupleA = new Couple(this.game, coupleX,0);
        this.couples.add(coupleA);
    },

    deathHandler: function(){
        console.log("HIT!!");
        this.couples.forEachExists(function (couple){
                couple.body.velocity.y=0;
            },
        this
        );

        this.coupleGenerator.timer.stop();

    },



    render: function() {

        //game.debug.text('Elapsed seconds: ' + this.game.time.totalElapsedSeconds(), 32, 32);

    }

};

var Dude = function(game,x,y,frame){
    Phaser.Sprite.call(this, game, x, y, 'dude', frame);
    this.anchor.setTo(0.5, 0.8);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.setSize(24, 24, 0, 0);

    //some default values
    this.alive = !1;
    this.SPEED = 100;
    this.boostSpeed = 0;
    this.SPEED_BOOST = 420;
    this.RETURN_SPEED = 100;
    this.LOWER_LIMIT = 100;
    this.isFarting = !1;
    this.shakeSpeed= 419;

    this.game.physics.arcade.enableBody(this);
    this.angle = -60;
    this.dudeTween = this.game.add.tween(this).to({angle:60}, this.shakeSpeed, Phaser.Easing.Sinusoidal.InOut, !0, 0, Number.MAX_VALUE, !0);
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    this.body.collideWorldBounds = true;
    this.isFarting = false;
};

Dude.prototype = Object.create(Phaser.Sprite.prototype);
Dude.prototype.constructor = Dude;

Dude.prototype.update = function () {
    this.boostSpeed > 50 ?
        (this.boostSpeed -= 15, this.body.velocity.x = Math.sin(this.rotation) * this.boostSpeed, this.body.velocity.y = Math.cos(this.rotation + Math.PI) * this.boostSpeed) :
        (this.isFarting = !1, this.frame = 0, this.dudeTween.resume(), this.body.velocity.x = Math.sin(this.rotation) * this.SPEED, this.body.velocity.y = this.game.height - this.body.y < this.LOWER_LIMIT ? 0 : this.RETURN_SPEED)
};

Dude.prototype.fart= function(){

    if (!this.isFarting) {
        this.boostSpeed = this.SPEED_BOOST;

        this.body.velocity.x = Math.sin(this.rotation) * this.boostSpeed;
        this.body.velocity.y = Math.cos(this.rotation + Math.PI) * this.boostSpeed;
        this.dudeTween.pause();
        this.isFarting = !0;
        this.frame = 1;

    }
};


var Couple = function(game,x,y,frame){
    Phaser.Sprite.call(this,game,x,y,'couple',frame);
    this.anchor.setTo(0.5,0.5);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.allowGravity = false;
    this.body.immovable = true;
    this.body.velocity.y = 150;
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
};


Couple.prototype = Object.create(Phaser.Sprite.prototype);
Couple.prototype.constructor = Couple;


Couple.prototype.update = function() {

};







game.state.add('boot', Boot);
game.state.add('preload', Preload);
game.state.add('menu', Menu);
game.state.add('play', Play);

game.state.start('boot');