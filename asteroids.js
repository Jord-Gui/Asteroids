"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 10)
        .attr("rpm", 10)
        .attr("hitbox", 20)
        .attr("invincible", "true"), ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 0,10 15,20 0,-20")
        .attr("style", "fill:yellow;stroke:white;stroke-width:1"), lives = 3, wave = 1, startTimer = new Elem(svg, 'text')
        .attr('x', 50)
        .attr('y', 100)
        .attr('fill', 'black')
        .attr('font-size', 100)
        .attr("stroke", "white")
        .attr("stroke-width", 1);
    startTimer.elem.textContent = "3";
    const mainInterval = Observable.interval(10), gameOver = mainInterval.filter(_ => lives === 0), keydown = Observable.fromEvent(document, "keydown").takeUntil(gameOver), keyup = Observable.fromEvent(document, "keyup").takeUntil(gameOver), currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr("transform")), lasers = [], asteroids = [], mainObservable = mainInterval
        .takeUntil(gameOver)
        .map((time) => {
        return {
            laserArray: lasers,
            asteroidArray: asteroids,
            time: time,
            countDown: startTimer
        };
    });
    moveShip("KeyW", moveShipForward);
    moveShip("KeyA", moveShipACW);
    moveShip("KeyD", moveShipCW);
    createLasers();
    moveLaser();
    summonAsteroids();
    moveAsteroid();
    removeShipInvincibility();
    animateCountdownTimer();
    playerLose();
    function moveShipACW() {
        return { x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) - Number(g.attr("rpm")) };
    }
    function moveShipCW() {
        return { x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) + Number(g.attr("rpm")) };
    }
    function moveShipForward() {
        const newPosition = nextPosition(svg, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(g.attr("velocity")), Number(currentShipPosition[3]), true);
        return { x: newPosition.nextX, y: newPosition.nextY, rotation: Number(currentShipPosition[3]) };
    }
    function moveShip(Key, moveFunction) {
        keydown
            .filter((e) => e.code === Key && !e.repeat)
            .flatMap(() => {
            return mainInterval
                .takeUntil(keyup)
                .map(() => {
                return { x: String(moveFunction().x), y: String(moveFunction().y), rotation: String(moveFunction().rotation) };
            });
        })
            .subscribe(({ x, y, rotation }) => {
            g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = rotation})`);
        });
    }
    function createLasers() {
        keydown
            .filter((e) => e.code === "Space" && !(e.repeat) && g.attr("invincible") === "false")
            .map(() => {
            return new Elem(svg, 'circle')
                .attr("cx", currentShipPosition[1])
                .attr("cy", currentShipPosition[2])
                .attr("rotation", currentShipPosition[3])
                .attr("r", 2)
                .attr("velocity", 10)
                .attr("style", "fill:black;fill-opacity:0;stroke:white;stroke-width:1");
        })
            .subscribe((laser) => lasers.push(laser));
    }
    function moveLaser() {
        mainObservable
            .flatMap(({ laserArray, asteroidArray }) => {
            return Observable
                .fromArray(laserArray)
                .map((laser) => {
                const newPosition = nextPosition(svg, Number(laser.attr("cx")), Number(laser.attr("cy")), Number(laser.attr("velocity")), Number(laser.attr("rotation")), false);
                const collidedAsteroids = asteroidArray.filter((a) => collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))));
                return { x: newPosition.nextX, y: newPosition.nextY, laser: laser, collidedAsteroids: collidedAsteroids };
            });
        })
            .subscribe(({ x, y, laser, collidedAsteroids }) => {
            x < 0 || y < 0 || x > svg.clientWidth || y > svg.clientHeight ? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)) : laser.attr("cx", x) && laser.attr("cy", y);
            collidedAsteroids.forEach((asteroid) => {
                asteroid.elem.remove();
                if (Number(asteroid.attr("r")) > 25)
                    createAsteroids(2, 25, 1.5, Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
                asteroids.splice(asteroids.indexOf(asteroid), 1);
                laser.elem.remove();
                lasers.splice(lasers.indexOf(laser), 1);
            });
        });
    }
    function createAsteroids(amount, radius, velocity, cx, cy) {
        mainInterval
            .takeUntil(mainInterval.filter((t) => t === (amount + 1) * 10))
            .map(() => {
            return new Elem(svg, "circle")
                .attr("r", radius)
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("rotation", Math.floor(Math.random() * 360))
                .attr("velocity", velocity)
                .attr("style", "fill:black;fill-opacity:0;stroke:white;stroke-width:1");
        })
            .subscribe((asteroid) => asteroids.push(asteroid));
    }
    function moveAsteroid() {
        mainObservable
            .flatMap(({ asteroidArray }) => {
            return Observable
                .fromArray(asteroidArray)
                .map((asteroid) => {
                const newPosition = nextPosition(svg, Number(asteroid.attr("cx")), Number(asteroid.attr("cy")), Number(asteroid.attr("velocity")), Number(asteroid.attr("rotation")), true);
                const collisionDetected = collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr("r")), Number(g.attr("hitbox")));
                return { x: newPosition.nextX, y: newPosition.nextY, asteroid: asteroid, collision: collisionDetected };
            });
        })
            .subscribe(({ x, y, asteroid, collision }) => {
            if (collision && (g.attr("invincible") === "false")) {
                lives--;
                document.getElementById("lives").innerHTML = `Lives: ${"🚀".repeat(lives)}`;
                if (lives > 0)
                    resetShip();
            }
            else
                asteroid.attr("cx", x).attr("cy", y);
        });
    }
    function resetShip() {
        g
            .attr("transform", "translate(300 300) rotate(0)")
            .attr("invincible", "true");
        currentShipPosition[1] = "300", currentShipPosition[2] = "300", currentShipPosition[3] = "0";
        ship.attr("style", "fill:yellow;stroke:white;stroke-width:1");
    }
    function removeShipInvincibility() {
        mainObservable
            .filter(({ time }) => time % 3000 === 0 && g.attr("invincible") === "true")
            .subscribe(() => {
            g.attr("invincible", "false");
            ship.attr("style", "fill:black;fill-opacity:0;stroke:white;stroke-width:1");
        });
    }
    function animateCountdownTimer() {
        mainObservable
            .filter(({ time }) => time % 1000 === 0)
            .subscribe(({ time, countDown }) => {
            if (time === 1000) {
                countDown.elem.textContent = "2";
            }
            else if (time === 2000) {
                countDown.elem.textContent = "1";
            }
            else if (time === 3000) {
                countDown.elem.textContent = "FIGHT!";
            }
            else {
                countDown.elem.remove();
            }
        });
    }
    function summonAsteroids() {
        mainObservable
            .filter(({ time, asteroidArray }) => time % 100 === 0 && asteroidArray.length === 0)
            .subscribe(() => {
            if (wave <= 3) {
                document.getElementById("waves").innerHTML = `Wave: ${wave}`;
                createAsteroids(wave * 2, 50, 1, Math.floor(Math.random() * svg.clientWidth), Math.floor(Math.random() * svg.clientHeight));
                wave += 1;
            }
            else {
                playerWin();
            }
        });
    }
    function playerWin() {
        document.getElementById("lives").innerHTML = "YOU WIN 💚";
        document.getElementById("lives").style.color = "green";
        ship.attr("style", "fill:green;stroke:white;stroke-width:1");
        lives = 0;
    }
    function playerLose() {
        gameOver
            .filter(() => asteroids.length > 0)
            .subscribe(() => {
            document.getElementById("lives").innerHTML = "YOU LOSE 😡";
            document.getElementById("lives").style.color = "red";
            ship.attr("style", "fill:red;stroke:white;stroke-width:1");
        });
    }
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map