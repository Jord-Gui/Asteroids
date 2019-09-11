"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 10)
        .attr("rpm", 10), ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:black;stroke:purple;stroke-width:5"), gameover = false;
    const timeObservable = Observable.interval(10), keydown = Observable.fromEvent(document, 'keydown').takeUntil(timeObservable.filter(_ => gameover === true)), keyup = Observable.fromEvent(document, 'keyup').takeUntil(timeObservable.filter(_ => gameover === true)), currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr('transform')), lasers = [], mainGame = timeObservable
        .takeUntil(timeObservable.filter(_ => gameover === true))
        .map(() => {
        return {
            lasers: lasers
        };
    });
    function moveShip(Key, moveFunction) {
        keydown
            .filter((e) => e.code === Key && !e.repeat)
            .flatMap(() => {
            return timeObservable
                .takeUntil(keyup)
                .map(() => {
                return { x: String(moveFunction().x), y: String(moveFunction().y), z: String(moveFunction().z) };
            });
        })
            .subscribe(({ x, y, z }) => {
            g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`);
        });
    }
    const moveACW = () => ({ x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) - Number(g.attr("rpm")) });
    const moveCW = () => ({ x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) + Number(g.attr("rpm")) });
    const moveForward = () => {
        const x = Number(currentShipPosition[1]);
        const y = Number(currentShipPosition[2]);
        const z = Number(currentShipPosition[3]);
        const newX = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Number(g.attr("velocity")) * Math.cos((z - 90) * (Math.PI / 180));
        const newY = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Number(g.attr("velocity")) * Math.sin((z - 90) * (Math.PI / 180));
        return { x: newX, y: newY, z: z };
    };
    moveShip("KeyW", moveForward);
    moveShip("KeyA", moveACW);
    moveShip("KeyD", moveCW);
    keydown
        .filter((e) => e.code === 'Space')
        .map(() => {
        return new Elem(svg, 'circle')
            .attr("cx", currentShipPosition[1])
            .attr("cy", currentShipPosition[2])
            .attr("z", currentShipPosition[3])
            .attr("r", 2)
            .attr("velocity", 20)
            .attr("style", "fill:white;stroke:purple;stroke-width:1");
    })
        .subscribe((laser) => lasers.push(laser));
    mainGame
        .flatMap(({ lasers }) => {
        return Observable
            .fromArray(lasers)
            .map((laser) => {
            const x = Number(laser.attr('cx')) + Number(laser.attr("velocity")) * Math.cos((Number(laser.attr('z')) - 90) * (Math.PI / 180));
            const y = Number(laser.attr('cy')) + Number(laser.attr("velocity")) * Math.sin((Number(laser.attr('z')) - 90) * (Math.PI / 180));
            return { x: x, y: y, laser: laser };
        });
    })
        .subscribe(({ x, y, laser }) => {
        x < 0 || y < 0 || x > svg.clientWidth || y > svg.clientHeight ? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)) : laser.attr('cx', x) && laser.attr('cy', y);
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map