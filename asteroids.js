"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 10)
        .attr("rpm", 10)
        .attr("hitbox", 20), ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 0,10 15,20 0,-20")
        .attr("style", "fill:black;stroke:white;stroke-width:1"), isGameOver = false;
    const tickTockInterval = Observable.interval(10), gameOver = tickTockInterval.filter(_ => isGameOver === true), keydown = Observable.fromEvent(document, "keydown").takeUntil(gameOver), keyup = Observable.fromEvent(document, "keyup").takeUntil(gameOver), currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr("transform")), lasers = [], asteroids = [], tickTockObservable = tickTockInterval
        .takeUntil(gameOver)
        .map(() => {
        return {
            lasers: lasers,
            asteroids: asteroids
        };
    });
    function collisionDetectedCircles(x1, y1, x2, y2, r1, r2) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), sum = r1 + r2;
        return distance < sum ? true : false;
    }
    function moveShip(Key, moveFunction) {
        keydown
            .filter((e) => e.code === Key && !e.repeat)
            .flatMap(() => {
            return tickTockInterval
                .takeUntil(keyup)
                .map(() => {
                return { x: String(moveFunction().x), y: String(moveFunction().y), z: String(moveFunction().z) };
            });
        })
            .subscribe(({ x, y, z }) => {
            g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`);
        });
    }
    const moveShipACW = () => ({ x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) - Number(g.attr("rpm")) });
    const moveShipCW = () => ({ x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) + Number(g.attr("rpm")) });
    const moveShipForward = () => {
        const x = Number(currentShipPosition[1]);
        const y = Number(currentShipPosition[2]);
        const z = Number(currentShipPosition[3]);
        const newX = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Number(g.attr("velocity")) * Math.cos((z - 90) * (Math.PI / 180));
        const newY = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Number(g.attr("velocity")) * Math.sin((z - 90) * (Math.PI / 180));
        return { x: newX, y: newY, z: z };
    };
    moveShip("KeyW", moveShipForward);
    moveShip("KeyA", moveShipACW);
    moveShip("KeyD", moveShipCW);
    keydown
        .filter((e) => e.code === "Space")
        .map(() => {
        return new Elem(svg, 'circle')
            .attr("cx", currentShipPosition[1])
            .attr("cy", currentShipPosition[2])
            .attr("z", currentShipPosition[3])
            .attr("r", 2)
            .attr("velocity", 10)
            .attr("style", "fill:#66ff66;stroke:#00cc66;stroke-width:1");
    })
        .subscribe((laser) => lasers.push(laser));
    tickTockObservable
        .flatMap(({ lasers }) => {
        return Observable
            .fromArray(lasers)
            .map((laser) => {
            const x = Number(laser.attr("cx")) + Number(laser.attr("velocity")) * Math.cos((Number(laser.attr("z")) - 90) * (Math.PI / 180));
            const y = Number(laser.attr("cy")) + Number(laser.attr("velocity")) * Math.sin((Number(laser.attr("z")) - 90) * (Math.PI / 180));
            const collidedAsteroids = asteroids.filter((a) => collisionDetectedCircles(x, y, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))));
            return { x: x, y: y, laser: laser, collidedAsteroids: collidedAsteroids };
        });
    })
        .subscribe(({ x, y, laser, collidedAsteroids }) => {
        x < 0 || y < 0 || x > svg.clientWidth || y > svg.clientHeight ? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)) : laser.attr("cx", x) && laser.attr("cy", y);
        collidedAsteroids.forEach((asteroid) => {
            asteroid.elem.remove();
            asteroids.splice(asteroids.indexOf(asteroid), 1);
            laser.elem.remove();
            lasers.splice(lasers.indexOf(laser), 1);
        });
    });
    tickTockInterval
        .takeUntil(tickTockInterval.filter(i => i === 50))
        .map(() => {
        return new Elem(svg, "circle")
            .attr("r", 25)
            .attr("cx", Math.floor(Math.random() * svg.clientWidth))
            .attr("cy", Math.floor(Math.random() * svg.clientHeight))
            .attr("z", Math.floor(Math.random() * 360))
            .attr("velocity", 2)
            .attr("style", "fill:black;stroke:white;stroke-width:1");
    })
        .subscribe((asteroid) => asteroids.push(asteroid));
    tickTockObservable
        .flatMap(({ asteroids }) => {
        return Observable
            .fromArray(asteroids)
            .map((asteroid) => {
            const x = Number(asteroid.attr("cx"));
            const newX = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Number(asteroid.attr("velocity")) * Math.cos((Number(asteroid.attr("z")) - 90) * (Math.PI / 180));
            const y = Number(asteroid.attr("cy"));
            const newY = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Number(asteroid.attr("velocity")) * Math.sin((Number(asteroid.attr("z")) - 90) * (Math.PI / 180));
            const collisionDetected = collisionDetectedCircles(x, y, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr("r")), Number(g.attr("hitbox")));
            return { x: newX, y: newY, asteroid: asteroid, collision: collisionDetected };
        });
    })
        .subscribe(({ x, y, asteroid, collision }) => {
        collision ? isGameOver = true : asteroid.attr("cx", x), asteroid.attr("cy", y);
    });
    tickTockInterval
        .takeUntil(gameOver)
        .filter(t => t > 1000)
        .filter(() => asteroids.length === 0)
        .subscribe(() => {
        let win = new Elem(svg, "text")
            .attr("x", 110)
            .attr("y", svg.clientHeight / 2)
            .attr("fill", "green")
            .attr("font-family", "liberation sans")
            .attr("font-size", 80);
        win.elem.textContent = "YOU WIN";
        ship.attr("style", "fill:green;stroke:white;stroke-width:1");
        isGameOver = true;
    });
    gameOver
        .filter(() => asteroids.length > 0)
        .subscribe(() => {
        let endGame = new Elem(svg, "text")
            .attr("x", 65)
            .attr("y", svg.clientHeight / 2)
            .attr("fill", "red")
            .attr("font-family", "liberation sans")
            .attr("font-size", 80);
        endGame.elem.textContent = "GAME OVER";
        ship.attr("style", "fill:red;stroke:white;stroke-width:1");
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map