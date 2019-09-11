"use strict";
function oldasteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 20)
        .attr("rpm", 20)
        .attr("x", 300)
        .attr("y", 300)
        .attr("z", 0)
        .attr("hitbox", 20);
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:black;stroke:purple;stroke-width:5");
    const keydown = Observable.fromEvent(document, 'keydown'), keyup = Observable.fromEvent(document, 'keyup'), timeObservable = Observable.interval(10), timeFastObservable = Observable.interval(1), lasers = [], asteroids = [], currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr('transform'));
    let gameOver = false;
    function collisionDetectedCircles(x1, y1, x2, y2, r1, r2) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), sum = r1 + r2;
        return distance < sum ? true : false;
    }
    keydown
        .filter(e => e.code === "KeyA" || e.code === "KeyD" || e.code === "KeyW")
        .scan({ x: 300, y: 300, z: 0 }, ({ x, y, z }, e) => {
        if (e.code === "KeyW") {
            x = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Number(g.attr("velocity")) * Math.cos((z - 90) * (Math.PI / 180));
            y = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Number(g.attr("velocity")) * Math.sin((z - 90) * (Math.PI / 180));
            g.attr("x", x);
            g.attr("y", y);
            return { x: x, y: y, z: z };
        }
        else if (e.code === "KeyD") {
            z = z + Number(g.attr("rpm"));
            g.attr("z", z);
            return { x: x, y: y, z: z };
        }
        else {
            return { x: x, y: y, z: z };
        }
    })
        .subscribe(value => g.attr("transform", `translate(${value.x} ${value.y}) rotate(${value.z})`));
    keydown
        .takeUntil(timeObservable.filter(() => gameOver))
        .filter(e => e.code === "Space")
        .map(() => {
        return new Elem(svg, 'circle')
            .attr("cx", g.attr("x"))
            .attr("cy", g.attr("y"))
            .attr("z", g.attr("z"))
            .attr("r", 2)
            .attr("style", "fill:white;stroke:purple;stroke-width:1");
    })
        .subscribe((laser) => lasers.push(laser));
    timeFastObservable
        .takeUntil(timeObservable.filter(() => gameOver))
        .subscribe(() => {
        lasers.forEach((laser) => {
            const x = Number(laser.attr('cx')) + Math.cos((Number(laser.attr('z')) - 90) * (Math.PI / 180));
            const y = Number(laser.attr('cy')) + Math.sin((Number(laser.attr('z')) - 90) * (Math.PI / 180));
            x < 0 || y < 0 || x > svg.clientWidth || y > svg.clientHeight ? laser.elem.remove() : laser.attr('cx', x) && laser.attr('cy', y);
            const collidedAsteroids = asteroids.filter((a) => collisionDetectedCircles(x, y, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))));
            collidedAsteroids.forEach((asteroid) => {
                asteroid.elem.remove();
                asteroids.splice(asteroids.indexOf(asteroid), 1);
                laser.elem.remove();
                lasers.splice(lasers.indexOf(laser), 1);
            });
        });
    });
    timeObservable
        .takeUntil(timeObservable.filter(i => i === 50))
        .map(() => {
        return new Elem(svg, 'circle')
            .attr("r", 25)
            .attr("cx", Math.floor(Math.random() * svg.clientWidth))
            .attr("cy", Math.floor(Math.random() * svg.clientHeight))
            .attr("z", Math.floor(Math.random() * 360))
            .attr("style", "fill:purple;stroke:blue;stroke-width:1");
    })
        .subscribe((asteroid) => asteroids.push(asteroid));
    timeObservable
        .takeUntil(timeObservable.filter(() => gameOver))
        .subscribe(() => {
        asteroids.forEach((asteroid) => {
            let x = Number(asteroid.attr("cx"));
            x = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Math.cos((Number(asteroid.attr('z')) - 90) * (Math.PI / 180));
            let y = Number(asteroid.attr("cy"));
            y = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Math.sin((Number(asteroid.attr('z')) - 90) * (Math.PI / 180));
            const collisionDetected = collisionDetectedCircles(x, y, Number(g.attr('x')), Number(g.attr('y')), Number(asteroid.attr('r')), Number(g.attr('hitbox')));
            collisionDetected ? (ship.elem.remove(), gameOver = true) : asteroid.attr("cx", x), asteroid.attr("cy", y);
        });
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        oldasteroids();
    };
//# sourceMappingURL=oldasteroid.js.map