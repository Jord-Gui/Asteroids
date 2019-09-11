"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 20)
        .attr("rpm", 20);
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:black;stroke:purple;stroke-width:5");
    const keydown = Observable.fromEvent(document, 'keydown'), keyup = Observable.fromEvent(document, 'keyup'), timeObservable = Observable.interval(20), currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr('transform'));
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
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map