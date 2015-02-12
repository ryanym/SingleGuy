
var game = new Phaser.Game(288, 505, Phaser.AUTO, 'singleguy');
//var score = 0;



/**
 * @author       Jeremy Dowell <jeremy@codevinsky.com>
 * @license      {@link http://www.wtfpl.net/txt/copying/|WTFPL}
 */

/**
 * Creates a new `Juicy` object.
 *
 * @class Phaser.Plugin.Juicy
 * @constructor
 *
 * @param {Phaser.Game} game Current game instance.
 */
Phaser.Plugin.Juicy = function (game) {

    Phaser.Plugin.call(this, game);

    /**
     * @property {Phaser.Rectangle} _boundsCache - A reference to the current world bounds.
     * @private
     */
    this._boundsCache = Phaser.Utils.extend(false, {}, this.game.world.bounds);

    /**
     * @property {number} _shakeWorldMax - The maximum world shake radius
     * @private
     */
    this._shakeWorldMax = 20;

    /**
     * @property {number} _shakeWorldTime - The maximum world shake time
     * @private
     */
    this._shakeWorldTime = 0;

    /**
     * @property {number} _trailCounter - A count of how many trails we're tracking
     * @private
     */
    this._trailCounter = 0;

    /**
     * @property {object} _overScales - An object containing overscaling configurations
     * @private
     */
    this._overScales = {};

    /**
     * @property {number} _overScalesCounter - A count of how many overScales we're tracking
     * @private
     */
    this._overScalesCounter = 0;
};


Phaser.Plugin.Juicy.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.Juicy.prototype.constructor = Phaser.Plugin.Juicy;



/**
 * Creates a new `Juicy.ScreenFlash` object.
 *
 * @class Phaser.Plugin.Juicy.ScreenFlash
 * @constructor
 *
 * @param {Phaser.Game} game -  Current game instance.
 * @param {string} color='white' - The color to flash the screen.
 * @memberof Phaser.Plugin.Juicy
 */
Phaser.Plugin.Juicy.ScreenFlash = function(game, color) {
    color = color || 'white';
    var bmd = game.add.bitmapData(game.width, game.height);
    bmd.ctx.fillStyle = color;
    bmd.ctx.fillRect(0,0, game.width, game.height);

    Phaser.Sprite.call(this, game, 0,0, bmd);
    this.alpha = 0;
};

Phaser.Plugin.Juicy.ScreenFlash.prototype = Object.create(Phaser.Sprite.prototype);
Phaser.Plugin.Juicy.ScreenFlash.prototype.constructor = Phaser.Plugin.Juicy.ScreenFlash;


/*
 * Flashes the screen
 *
 * @param {number} [maxAlpha=1] - The maximum alpha to flash the screen to
 * @param {number} [duration=100] - The duration of the flash in milliseconds
 * @method Phaser.Plugin.Juicy.ScreenFlash.prototype.flash
 * @memberof Phaser.Plugin.Juicy.ScreenFlash
 */
Phaser.Plugin.Juicy.ScreenFlash.prototype.flash = function(maxAlpha, duration) {
    maxAlpha = maxAlpha || 1;
    duration = duration || 100;
    var flashTween = this.game.add.tween(this).to({alpha: maxAlpha}, 100, Phaser.Easing.Bounce.InOut, true,0, 0, true);
    flashTween.onComplete.add(function() {
        this.alpha = 0;
    }, this);
};

/**
 * Creates a new `Juicy.Trail` object.
 *
 * @class Phaser.Plugin.Juicy.Trail
 * @constructor
 *
 * @param {Phaser.Game} game -  Current game instance.
 * @param {number} [trailLength=100] - The length of the trail
 * @param {number} [color=0xFFFFFF] - The color of the trail
 * @memberof Phaser.Plugin.Juicy
 */
Phaser.Plugin.Juicy.Trail = function(game, trailLength, color) {
    Phaser.Graphics.call(this, game, 0,0);

    /**
     * @property {Phaser.Sprite} target - The target sprite whose movement we want to create the trail from
     */
    this.target = null;
    /**
     * @property {number} trailLength - The number of segments to use to create the trail
     */
    this.trailLength = trailLength || 100;
    /**
     * @property {number} trailWidth - The width of the trail
     */
    this.trailWidth = 15.0;

    /**
     * @property {boolean} trailScale - Whether or not to taper the trail towards the end
     */
    this.trailScaling = false;

    /**
     * @property {Phaser.Sprite} trailColor - The color of the trail
     */
    this.trailColor = color || 0xFFFFFF;

    /**
     * @property {Array<Phaser.Point>} _segments - A historical collection of the previous position of the target
     * @private
     */
    this._segments = [];
    /**
     * @property {Array<number>} _verts - A collection of vertices created from _segments
     * @private
     */
    this._verts = [];
    /**
     * @property {Array<Phaser.Point>} _segments - A collection of indices created from _verts
     * @private
     */
    this._indices = [];

};

Phaser.Plugin.Juicy.Trail.prototype = Object.create(Phaser.Graphics.prototype);
Phaser.Plugin.Juicy.Trail.prototype.constructor = Phaser.Plugin.Juicy.Trail;

/**
 * Updates the Trail if a target is set
 *
 * @method Phaser.Plugin.Juicy.Trail#update
 * @memberof Phaser.Plugin.Juicy.Trail
 */

Phaser.Plugin.Juicy.Trail.prototype.update = function() {
    if(this.target) {
        this.x = this.target.x;
        this.y = this.target.y;
        this.addSegment(this.target.x, this.target.y);
        this.redrawSegments(this.target.x, this.target.y);
    }
};

/**
 * Adds a segment to the segments list and culls the list if it is too long
 *
 * @param {number} [x] - The x position of the point
 * @param {number} [y] - The y position of the point
 *
 * @method Phaser.Plugin.Juicy.Trail#addSegment
 * @memberof Phaser.Plugin.Juicy.Trail
 */
Phaser.Plugin.Juicy.Trail.prototype.addSegment = function(x, y) {
    var segment;

    while(this._segments.length > this.trailLength) {
        segment = this._segments.shift();
    }
    if(!segment) {
        segment = new Phaser.Point();
    }

    segment.x = x;
    segment.y = y;

    this._segments.push(segment);
};


/**
 * Creates and draws the triangle trail from segments
 *
 * @param {number} [offsetX] - The x position of the object
 * @param {number} [offsetY] - The y position of the object
 *
 * @method Phaser.Plugin.Juicy.Trail#redrawSegment
 * @memberof Phaser.Plugin.Juicy.Trail
 */
Phaser.Plugin.Juicy.Trail.prototype.redrawSegments = function(offsetX, offsetY) {
    this.clear();
    var s1, // current segment
        s2, // previous segment
        vertIndex = 0, // keeps track of which vertex index we're at
        offset, // temporary storage for amount to extend line outwards, bigger = wider
        ang, //temporary storage of the inter-segment angles
        sin = 0, // as above
        cos = 0; // again as above

    // first we make sure that the vertice list is the same length as we we want
    // each segment (except the first) will create to vertices with two values each
    if (this._verts.length !== (this._segments.length -1) * 4) {
        // if it's not correct, we clear the entire list
        this._verts = [];
    }

    // now we loop over all the segments, the list has the "youngest" segment at the end
    var prevAng = 0;

    for(var j = 0; j < this._segments.length; ++j) {
        // store the active segment for convenience
        s1 = this._segments[j];

        // if there's a previous segment, time to do some math
        if(s2) {
            // we calculate the angle between the two segments
            // the result will be in radians, so adding half of pi will "turn" the angle 90 degrees
            // that means we can use the sin and cos values to "expand" the line outwards
            ang = Math.atan2(s1.y - s2.y, s1.x - s2.x) + Math.PI / 2;
            sin = Math.sin(ang);
            cos = Math.cos(ang);

            // now it's time to creat ethe two vertices that will represent this pair of segments
            // using a loop here is probably a bit overkill since it's only two iterations
            for(var i = 0; i < 2; ++i) {
                // this makes the first segment stand out to the "left" of the line
                // annd the second to the right, changing that magic number at the end will alther the line width
                offset = ( -0.5 + i / 1) * this.trailWidth;

                // if trail scale effect is enabled, we scale down the offset as we move down the list
                if(this.trailScaling) {
                    offset *= j / this._segments.length;
                }

                // finally we put to values in the vert list
                // using the segment coordinates as a base we add the "extended" point
                // offsetX and offsetY are used her to move the entire trail
                this._verts[vertIndex++] = s1.x + cos * offset - offsetX;
                this._verts[vertIndex++] = s1.y + sin * offset - offsetY;
            }
        }
        // finally store the current segment as the previous segment and go for another round
        s2 = s1.copyTo({});
    }
    // we need at least four vertices to draw something
    if(this._verts.length >= 8) {
        // now, we have a triangle "strip", but flash can't draw that without
        // instructions for which vertices to connect, so it's time to make those

        // here, we loop over all the vertices and pair them together in triangles
        // each group of four vertices forms two triangles
        for(var k = 0; k < this._verts.length; k++) {
            this._indices[k * 6 + 0] = k * 2 + 0;
            this._indices[k * 6 + 1] = k * 2 + 1;
            this._indices[k * 6 + 2] = k * 2 + 2;
            this._indices[k * 6 + 3] = k * 2 + 1;
            this._indices[k * 6 + 4] = k * 2 + 2;
            this._indices[k * 6 + 5] = k * 2 + 3;
        }
        this.beginFill(this.trailColor);
        this.drawTriangles(this._verts, this._indices);
        this.endFill();

    }
};






/**
 * Add a Sprite reference to this Plugin.
 * All this plugin does is move the Sprite across the screen slowly.
 * @type {Phaser.Sprite}
 */

/**
 * Begins the screen shake effect
 *
 * @param {number} [duration=20] - The duration of the screen shake
 * @param {number} [strength=20] - The strength of the screen shake
 *
 * @method Phaser.Plugin.Juicy#redrawSegment
 * @memberof Phaser.Plugin.Juicy
 */
Phaser.Plugin.Juicy.prototype.shake = function (duration, strength) {
    this._shakeWorldTime = duration || 20;
    this._shakeWorldMax = strength || 20;
    this.game.world.setBounds(this._boundsCache.x - this._shakeWorldMax, this._boundsCache.y - this._shakeWorldMax, this._boundsCache.width + this._shakeWorldMax, this._boundsCache.height + this._shakeWorldMax);
};


/**
 * Creates a 'Juicy.ScreenFlash' object
 *
 * @param {string} color - The color of the screen flash
 *
 * @type {Phaser.Plugin.Juicy.ScreenFlash}
 */

Phaser.Plugin.Juicy.prototype.createScreenFlash = function(color) {
    return new Phaser.Plugin.Juicy.ScreenFlash(this.game, color);
};


/**
 * Creates a 'Juicy.Trail' object
 *
 * @param {number} length - The length of the trail
 * @param {number} color - The color of the trail
 *
 * @type {Phaser.Plugin.Juicy.Trail}
 */
Phaser.Plugin.Juicy.prototype.createTrail = function(length, color) {
    return new Phaser.Plugin.Juicy.Trail(this.game, length, color);
};


/**
 * Creates the over scale effect on the given object
 *
 * @param {Phaser.Sprite} object - The object to over scale
 * @param {number} [scale=1.5] - The scale amount to overscale by
 * @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
 *
 */
Phaser.Plugin.Juicy.prototype.overScale = function(object, scale, initialScale) {
    scale = scale || 1.5;
    var id = this._overScalesCounter++;
    initialScale = initialScale || new Phaser.Point(1,1);
    var scaleObj = this._overScales[id];
    if(!scaleObj) {
        scaleObj = {
            object: object,
            cache: initialScale.copyTo({})
        };
    }
    scaleObj.scale = scale;

    this._overScales[id] = scaleObj;
};

/**
 * Creates the jelly effect on the given object
 *
 * @param {Phaser.Sprite} object - The object to gelatinize
 * @param {number} [strength=0.2] - The strength of the effect
 * @param {number} [delay=0] - The delay of the snap-back tween. 50ms are automaticallly added to whatever the delay amount is.
 * @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
 *
 */
Phaser.Plugin.Juicy.prototype.jelly = function(object, strength, delay, initialScale) {
    strength = strength || 0.2;
    delay = delay || 0;
    initialScale = initialScale ||  new Phaser.Point(1, 1);

    this.game.add.tween(object.scale).to({x: initialScale.x + (initialScale.x * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay)
        .to({x: initialScale.x}, 600, Phaser.Easing.Elastic.Out, true);

    this.game.add.tween(object.scale).to({y: initialScale.y + (initialScale.y * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay + 50)
        .to({y: initialScale.y}, 600, Phaser.Easing.Elastic.Out, true);
};

/**
 * Creates the mouse stretch effect on the given object
 *
 * @param {Phaser.Sprite} object - The object to mouse stretch
 * @param {number} [strength=0.5] - The strength of the effect
 * @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
 *
 */
Phaser.Plugin.Juicy.prototype.mouseStretch = function(object, strength, initialScale) {
    strength = strength || 0.5;
    initialScale = initialScale || new Phaser.Point(1,1);
    object.scale.x = initialScale.x + (Math.abs(object.x - this.game.input.activePointer.x) / 100) * strength;
    object.scale.y = initialScale.y + (initialScale.y * strength) - (object.scale.x * strength);
};

/**
 * Runs the core update function and causes screen shake and overscaling effects to occur if they are queued to do so.
 *
 * @method Phaser.Plugin.Juicy#update
 * @memberof Phaser.Plugin.Juicy
 */
Phaser.Plugin.Juicy.prototype.update = function () {
    var scaleObj;
    // Screen Shake
    if(this._shakeWorldTime > 0) {
        var magnitude = (this._shakeWorldTime / this._shakeWorldMax) * this._shakeWorldMax;
        var x = this.game.rnd.integerInRange(-magnitude, magnitude);
        var y = this.game.rnd.integerInRange(-magnitude, magnitude);

        this.game.camera.x = x;
        this.game.camera.y = y;
        this._shakeWorldTime--;
        if(this._shakeWorldTime <= 0) {
            this.game.world.setBounds(this._boundsCache.x, this._boundsCache.x, this._boundsCache.width, this._boundsCache.height);
        }
    }

    // over scales
    for(var s in this._overScales) {
        if(this._overScales.hasOwnProperty(s)) {
            scaleObj = this._overScales[s];
            if(scaleObj.scale > 0.01) {
                scaleObj.object.scale.x = scaleObj.scale * scaleObj.cache.x;
                scaleObj.object.scale.y = scaleObj.scale * scaleObj.cache.y;
                scaleObj.scale -= this.game.time.elapsed * scaleObj.scale * 0.35;
            } else {
                scaleObj.object.scale.x = scaleObj.cache.x;
                scaleObj.object.scale.y = scaleObj.cache.y;
                delete this._overScales[s];
            }
        }
    }
};

// for browserify compatibility
if(typeof module === 'object' && module.exports) {
    module.exports = Phaser.Plugin.Juicy;
}



// Draw Triangles Polyfill for back compatibility
if(!Phaser.Graphics.prototype.drawTriangle) {
    Phaser.Graphics.prototype.drawTriangle = function(points, cull) {
        var triangle = new Phaser.Polygon(points);
        if (cull) {
            var cameraToFace = new Phaser.Point(this.game.camera.x - points[0].x, this.game.camera.y - points[0].y);
            var ab = new Phaser.Point(points[1].x - points[0].x, points[1].y - points[0].y);
            var cb = new Phaser.Point(points[1].x - points[2].x, points[1].y - points[2].y);
            var faceNormal = cb.cross(ab);
            if (cameraToFace.dot(faceNormal) > 0) {
                this.drawPolygon(triangle);
            }
        } else {
            this.drawPolygon(triangle);
        }
        return;
    };

    /*
     * Draws {Phaser.Polygon} triangles
     *
     * @param {Array<Phaser.Point>|Array<number>} vertices - An array of Phaser.Points or numbers that make up the vertices of the triangles
     * @param {Array<number>} {indices=null} - An array of numbers that describe what order to draw the vertices in
     * @param {boolean} [cull=false] - Should we check if the triangle is back-facing
     * @method Phaser.Graphics.prototype.drawTriangles
     */

    Phaser.Graphics.prototype.drawTriangles = function(vertices, indices, cull) {

        var point1 = new Phaser.Point(),
            point2 = new Phaser.Point(),
            point3 = new Phaser.Point(),
            points = [],
            i;

        if (!indices) {
            if(vertices[0] instanceof Phaser.Point) {
                for(i = 0; i < vertices.length / 3; i++) {
                    this.drawTriangle([vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]], cull);
                }
            } else {
                for (i = 0; i < vertices.length / 6; i++) {
                    point1.x = vertices[i * 6 + 0];
                    point1.y = vertices[i * 6 + 1];
                    point2.x = vertices[i * 6 + 2];
                    point2.y = vertices[i * 6 + 3];
                    point3.x = vertices[i * 6 + 4];
                    point3.y = vertices[i * 6 + 5];
                    this.drawTriangle([point1, point2, point3], cull);
                }

            }
        } else {
            if(vertices[0] instanceof Phaser.Point) {
                for(i = 0; i < indices.length /3; i++) {
                    points.push(vertices[indices[i * 3 ]]);
                    points.push(vertices[indices[i * 3 + 1]]);
                    points.push(vertices[indices[i * 3 + 2]]);
                    if(points.length === 3) {
                        this.drawTriangle(points, cull);
                        points = [];
                    }

                }
            } else {
                for (i = 0; i < indices.length; i++) {
                    point1.x = vertices[indices[i] * 2];
                    point1.y = vertices[indices[i] * 2 + 1];
                    points.push(point1.copyTo({}));
                    if (points.length === 3) {
                        this.drawTriangle(points, cull);
                        points = [];
                    }
                }
            }
        }
    };
};

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

        this.load.spritesheet("debris", "assets/debris.png", 8, 5)

        this.load.image('scoreboard', 'assets/scoreboard.png');
        this.load.image('gameover', 'assets/gameover.png');
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
        this.juicy = this.game.plugins.add(new Phaser.Plugin.Juicy(this));
        this.dude = new Dude(this.game,this.world.centerX,400,3);
        this.game.add.existing(this.dude);
        this.couples = this.game.add.group();
        this.game.input.onDown.add(this.dude.fart, this.dude);
        this.coupleGenerator = this.game.time.events.loop(Phaser.Timer.SECOND, this.generateCouples,this);
        this.coupleGenerator.timer.start();

        this.scoreCounter = this.game.time.events.loop(500, this.updateScore,this);
        this.scoreCounter.timer.start();
        this.score = 0;
        this.scoreText = this.game.add.bitmapText(this.game.width/2, 10, 'flappyfont',this.score.toString(), 24);

        this.screenFlash = this.juicy.createScreenFlash("red");
        this.add.existing(this.screenFlash);


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
        this.dude.alive = !1;
        this.scoreCounter.timer.stop();
        this.coupleGenerator.timer.stop();
        this.dude.dudeTween.stop();
        this.screenFlash.flash();
        this.scoreboard = new Scoreboard(this.game);
        this.game.add.existing(this.scoreboard);
        this.scoreboard.show(this.score);
        this.dude.kill();
    },



    render: function() {

        //game.debug.text('Elapsed seconds: ' + this.game.time.totalElapsedSeconds(), 32, 32);

    },

    shutdown: function() {
        //this.input.destroy();
        this.dude.destroy();
        this.couples.destroy();
        this.scoreboard.destroy();
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
    this.events.onKilled.add(this.onKilled, this)
};

Dude.prototype = Object.create(Phaser.Sprite.prototype);
Dude.prototype.constructor = Dude;

Dude.prototype.update = function () {
   // if (this.alive) {

        this.boostSpeed > 50 ?
            (this.boostSpeed -= 15, this.body.velocity.x = Math.sin(this.rotation) * this.boostSpeed, this.body.velocity.y = Math.cos(this.rotation + Math.PI) * this.boostSpeed) :
            (this.isFarting = !1, this.frame = 0, this.dudeTween.resume(), this.body.velocity.x = Math.sin(this.rotation) * this.SPEED, this.body.velocity.y = this.game.height - this.body.y < this.LOWER_LIMIT ? 0 : this.RETURN_SPEED)
  //  }
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

Dude.prototype.onKilled= function(){

    var a = this.game.add.emitter(this.x, this.y),
        b = 4e3;
    a.setAlpha(1, 0, b, Phaser.Easing.Linear.InOut), a.makeParticles("debris", [0, 1, 2, 3], 100, !0, !1), a.minParticleSpeed = new Phaser.Point(-200, -100), a.maxParticleSpeed = new Phaser.Point(200, 300), a.start(!0, b, null, 80)
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

var Scoreboard = function(game) {

    var gameover;

    Phaser.Group.call(this, game);
    this.gameover = this.game.add.sprite(this.game.width/2, 100, 'gameover');
    this.gameover.anchor.setTo(0.5, 0.5);
   // this.add(this.gameover);
    this.scoreboard = this.game.add.sprite(this.game.width/2, 200, 'scoreboard');
    this.scoreboard.anchor.setTo(0.5, 0.5);
  //  this.add(this.scoreboard)
    this.scoreText = this.game.add.bitmapText(this.scoreboard.width, 180, 'flappyfont', '', 18);
   // this.add(this.scoreText);

    this.bestScoreText = this.game.add.bitmapText(this.scoreboard.width, 230, 'flappyfont', '', 18);
    //this.add(this.bestScoreText);

    // add our start button with a callback
    this.startButton = this.game.add.button(this.game.width/2, 300, 'startButton', this.startClick, this);
    this.startButton.anchor.setTo(0.5,0.5);

    //this.add(this.startButton);

    this.y = this.game.height;
    this.x = 0;

    console.log("scoreboard instance")

};

Scoreboard.prototype = Object.create(Phaser.Group.prototype);
Scoreboard.prototype.constructor = Scoreboard;

Scoreboard.prototype.show = function(score) {
    var bestScore;
    this.scoreText.setText(score.toString());
    if(!!localStorage) {
        bestScore = localStorage.getItem('bestScore');
        if(!bestScore || bestScore < score) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
        }
    } else {
        bestScore = 'N/A';
    }

    this.bestScoreText.setText(bestScore.toString());
};

Scoreboard.prototype.startClick = function() {
    this.game.state.start('play');
};


Scoreboard.prototype.update = function() {

}







game.state.add('boot', Boot);
game.state.add('preload', Preload);
game.state.add('menu', Menu);
game.state.add('play', Play);

game.state.start('boot');