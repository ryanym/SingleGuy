
var game = new Phaser.Game(288, 505, Phaser.AUTO, 'singleguy');

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
        this.physics.arcade.gravity.y = 500;


        this.background = this.game.add.sprite(0,0,'background');
        this.dude = new Dude(this.game,this.world.centerX,400,3);
        this.game.add.existing(this.dude);

        this.game.input.onDown.add(this.dude.fart, this.dude);
        this.coupleGenerator = this.game.time.events.loop(Phaser.Timer.SECOND, this.generateCouples,this);
        this.coupleGenerator.timer.start();

    },

    update: function(){
       // this.game.physics.arcade.collide(this.dude, this.ground);


    },

    generateCouples: function(){
        var coupleX = this.game.rnd.integerInRange(20,268);
        this.couple = new Couple(this.game,coupleX,0);
        this.game.add.existing(this.couple);
        console.log("couples generated!!!");

    }


};

var Dude = function(game,x,y,frame){
    Phaser.Sprite.call(this, game, x, y, 'dude', frame);
    this.anchor.setTo(0.5, 0.8);

    this.game.physics.arcade.enableBody(this);
    this.angle = -60;
    this.dudeTween = this.game.add.tween(this).to({angle:60}, 600,Phaser.Easing.Sinusoidal.InOut, !0, 0, Number.MAX_VALUE, !0);
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    this.body.collideWorldBounds = true;
    this.isFarting = false;
};

Dude.prototype = Object.create(Phaser.Sprite.prototype);
Dude.prototype.constructor = Dude;

Dude.prototype.fart= function(){

    if (!this.isFarting) {
        this.body.velocity.x = Math.sin(this.rotation) * 300;
        this.body.velocity.y = Math.cos(this.rotation + Math.PI) * 300;
        this.dudeTween.pause();
    }
};

Dude.prototype.update = function(){
    if (this.body.velocity.y < 0){
        this.isFarting = true;

    }else{
        this.isFarting = false;
        this.dudeTween.resume();
    }
   // console.log(this.isFarting + "!!!" + "\t" + this.body.velocity.x + "\t" + this.body.velocity.y);

};


var Couple = function(game,x,y,frame){
    Phaser.Sprite.call(this,game,x,y,'couple',frame);
    this.anchor.setTo(0.5,0.5);
    this.game.physics.arcade.enableBody(this);
    this.body.allowGravity = false;
    this.body.immovable = true;
    this.body.velocity.y = 150;
}


Couple.prototype = Object.create(Phaser.Sprite.prototype);
Couple.prototype.constructor = Couple;


Couple.prototype.update = function() {
    //this.checkWorldBounds();
};

Couple.prototype.checkWorldBounds = function() {
    if(!this.body.inWorld) {
        this.exists = false;
    }
};



game.state.add('boot', Boot);
game.state.add('preload', Preload);
game.state.add('menu', Menu);
game.state.add('play', Play);

game.state.start('boot');