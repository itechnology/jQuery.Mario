// http://api.jquery.com/animate/
jQuery(document).ready(function () {
    // Cache DOM Elements for quick access
    var score = jQuery("#score");
    var scoreCount = 1;

    var gameOver = jQuery("#game-over");
    var sun = jQuery("#sun");

    var mario = jQuery(".mario");
    var marioDirLeft = false;

    var ball = jQuery("#ball");
    var ballSize = {
        height: ball.height(),
        width: ball.width()
    };

    var boss = jQuery("#boss");
    var bossSize = {
        height: boss.height(),
        width: boss.width()
    };

    var explosion = jQuery("#explosion");

    // Not all browsers support OGG (http://html5doctor.com/native-audio-in-the-browser/)    
    var sndTheme = new Audio("media/audio/theme.ogg");
    var sndExplosion = new Audio("media/audio/explosion.ogg");
    var sndFireBall = new Audio("media/audio/fireball.ogg");
    var sndJump = new Audio("media/audio/jump.ogg");
    var sndGameOver = new Audio("media/audio/game-over.ogg");

    // Generate Random Range (for speed & direction)
    function randomMinMax(min, max) {
        return Math.floor(min + (1 + max - min) * Math.random());
    }

    // Collision Testing
    // item1 position & item1 size
    // item2 position & item2 size
    function testCollision(position1, size1, position2, size2) {
        if (((position1.left + size1.width) > position2.left) &&
            ((position1.top + size1.height) > position2.top) &&
            ((position2.left + size2.width) > position1.left) &&
            ((position2.top + size2.height) > position1.top)) {

            // BadaBoom !
            triggerExplosion(position1.top, position1.left);
        }
    }

    // Boss Blink Animation (count must be even number)
    function blinkBoss(count) {
        if (count > 0) {
            count--;

            boss.animate({ "opacity": "toggle" }, {
                duration: 75,
                queue: false,
                complete: function () {
                    blinkBoss(count);
                }
            });
        }
    }

    // Game Over
    function endGame() {
        boss.stop().hide(0);
        explosion.stop().hide(0);

        sndTheme.pause();
        sndExplosion.pause();

        gameOver.show(0);
        sndGameOver.play();

        // CSS3 :target animation
        document.location.href = "#game-over";
    }

    // Explosion Animation
    var explosionInProgress = false;
    function triggerExplosion(top, left) {
        if (!explosionInProgress) {
            explosionInProgress = true;

            sndExplosion.play();
            blinkBoss(4);
            score.html(scoreCount++);

            if (scoreCount > 5) {
                endGame();
                return;
            }

            // CSS3 :target animation
            document.location.href = "#sun";

            // WTF: position is wrong ..blind adjustments here !
            top = (top - 85);
            left = (left - 255);

            explosion
                .css({ top: top, left: left })
                .show(300)
                .hide(100, function () {
                    // CSS3 :target animation
                    document.location.href = "#game";

                    explosionInProgress = false;
                    boss.css({ "opacity": 1 });
                });
        }
    }

    // Loop Boss Animation    
    function animateBoss() {
        var top = randomMinMax(125, 235);
        var left = randomMinMax(290, 390);
        var speed = randomMinMax(750, 2000);

        // 2) Animate Boss
        boss.animate({ top: top, left: left }, {
            duration: speed,
            queue: false,
            complete: animateBoss
        });
    }

    // Loop Sun Animation    
    function animateSun() {
        var left = randomMinMax(80, 390);

        // 2) Animate Sun
        sun.animate({ left: left }, 1500, animateSun);
    }

    // Mario Jump Animation
    var isJumping = false;
    function marioJump() {
        if (!isJumping) {
            isJumping = true;

            var imgWalk = marioDirLeft ? "mario mario-walk-left" : "mario mario-walk-right";
            var imgJump = marioDirLeft ? "mario mario-jump-left" : "mario mario-jump-right";

            sndJump.play();
            mario
                .attr("class", imgJump)
                .animate({ top: 210 }, 500)
                .animate({ top: 250 }, 500, function () {
                    mario
                        .attr("class", imgWalk)
                    isJumping = false;
                });
        }
    }

    // Mario Move Left Animation    
    var isMovingLeft = false;
    function marioLeft() {
        marioDirLeft = true;

        if (!isMovingLeft) {
            isMovingLeft = true;
            mario
                .attr("class", "mario mario-walk-left")
                .animate({ left: "-=10px" }, {
                    duration: 100,
                    step: function (now, fx) {
                        if (now < 20) {
                            mario.stop(false, true);
                            isMovingLeft = false;
                        }
                    },
                    queue: false,
                    complete: function () { isMovingLeft = false; }
                });
        }
    }

    // Mario Move Right Animation
    var isMovingRight = false;
    function marioRight() {
        marioDirLeft = false;

        if (!isMovingRight) {
            isMovingRight = true;
            mario
                .attr("class", "mario mario-walk-right")
                .animate({ left: "+=10px" }, {
                    duration: 100,
                    step: function (now, fx) {
                        if (now > 180) {
                            mario.stop(false, true);
                            isMovingRight = false;
                        }
                    },
                    queue: false,
                    complete: function () { isMovingRight = false; }
                });
        }
    }

    // Mario Shoot Animation
    var isShooting = false;
    function marioShoot() {
        if (!isShooting) {
            isShooting = true;
            sndFireBall.play();

            var direction = marioDirLeft ? 0 : 450;

            // WTF: position is wrong ..blind adjustments here !
            var top = (mario.position().top - 85);
            var left = (mario.position().left - 255);

            ball
            .css({ top: top, left: left })
            .show(0)
            .animate({ top: 150, left: direction }, {
                duration: 1000,
                step: function (now, fx) {
                    testCollision(ball.position(), ballSize, boss.position(), bossSize);
                },
                queue: false,
                complete: function () {
                    ball.hide(0);
                    isShooting = false;
                }
            });
        }
    };

    // Start Game        
    function start() {
        boss.show(500);
        animateBoss();

        // Loop Theme Sound, i think this crashes IE
        sndTheme.play();
        sndTheme.addEventListener('ended', function () {
            this.currentTime = 0;
            this.play();
        });

        sndGameOver.addEventListener('ended', function () {
            marioJump();
        });
    }

    // Bind Control Keys
    jQuery(document).bind("keydown", function (event) {
        var key = event.keyCode || event.which;

        switch (key) {
            case 32: /* Space Bar */
                if (!isShooting) {
                    marioShoot();
                }
                break;
            case 37: /* Left Arrow */
                if (!isMovingLeft && !isMovingRight) {
                    marioLeft();
                }
                break;
            case 38: /* Up Arrow */
                if (!isJumping) {
                    marioJump();
                }
                break;
            case 39: /* Right Arrow */
                if (!isMovingRight && !isMovingLeft) {
                    marioRight();
                }
                break;
        }
    });

    jQuery("button").click(function () {
        start();
        jQuery("button").hide(0);
    });

    animateSun();
});