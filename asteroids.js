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
    keydown
        .filter((e) => e.code === "KeyW")
        .flatMap(() => {
        return timeObservable
            .takeUntil(keyup)
            .map(() => {
            let x = Number(currentShipPosition[1]);
            let y = Number(currentShipPosition[2]);
            let z = Number(currentShipPosition[3]);
            x = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + Number(g.attr("velocity")) * Math.cos((z - 90) * (Math.PI / 180));
            y = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + Number(g.attr("velocity")) * Math.sin((z - 90) * (Math.PI / 180));
            return { x: String(x), y: String(y), z: String(z) };
        });
    })
        .subscribe(({ x, y, z }) => {
        g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`);
    });
    keydown
        .filter((e) => e.code === "KeyA")
        .flatMap(() => {
        return timeObservable
            .takeUntil(keyup)
            .map(() => {
            return { x: currentShipPosition[1], y: currentShipPosition[2], z: Number(currentShipPosition[3]) - Number(g.attr("rpm")) };
        });
    })
        .subscribe(({ x, y, z }) => {
        g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = String(z)})`);
    });
    keydown
        .filter((e) => e.code === "KeyD")
        .flatMap(() => {
        return timeObservable
            .takeUntil(keyup)
            .map(() => {
            return { x: currentShipPosition[1], y: currentShipPosition[2], z: Number(currentShipPosition[3]) + Number(g.attr("rpm")) };
        });
    })
        .subscribe(({ x, y, z }) => {
        g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = String(z)})`);
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map