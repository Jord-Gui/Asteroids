"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)")
        .attr("velocity", 20)
        .attr("rpm", 20)
        .attr("x", 300)
        .attr("y", 300)
        .attr("z", 0);
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:black;stroke:purple;stroke-width:5");
    const keydown = Observable.fromEvent(document, 'keydown');
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
        else if (e.code === "KeyA") {
            z = z - Number(g.attr("rpm"));
            g.attr("z", z);
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
        .filter(e => e.code === "Space")
        .flatMap(() => {
        let laser = new Elem(svg, 'circle')
            .attr("cx", g.attr("x"))
            .attr("cy", g.attr("y"))
            .attr("z", g.attr("z"))
            .attr("r", 2)
            .attr("style", "fill:blue;stroke:purple;stroke-width:1");
        return Observable.interval(1)
            .map(() => {
            return {
                cx: Number(laser.attr('cx')) + Math.cos((Number(laser.attr('z')) - 90) * (Math.PI / 180)),
                cy: Number(laser.attr('cy')) + Math.sin((Number(laser.attr('z')) - 90) * (Math.PI / 180)),
                laser: laser
            };
        });
    })
        .subscribe(({ cx, cy, laser }) => {
        cx < 0 || cy < 0 || cx > svg.clientWidth || cy > svg.clientHeight ? laser.elem.remove() : laser.attr('cx', cx) && laser.attr('cy', cy);
    });
    const asteroidObservable = Observable.interval(1);
    asteroidObservable
        .takeUntil(asteroidObservable.filter(i => i === 5))
        .map(() => {
        return new Elem(svg, 'circle')
            .attr("r", 25)
            .attr("cx", Math.floor(Math.random() * svg.clientWidth))
            .attr("cy", Math.floor(Math.random() * svg.clientHeight))
            .attr("z", Math.floor(Math.random() * 360))
            .attr("style", "fill:pink;stroke:purple;stroke-width:1");
    })
        .subscribe((asteroid) => {
        Observable.interval(10)
            .map(() => {
            let cx = Number(asteroid.attr("cx"));
            cx = cx < 0 ? svg.clientWidth : cx > svg.clientWidth ? 0 : cx + Math.cos((Number(asteroid.attr('z')) - 90) * (Math.PI / 180));
            let cy = Number(asteroid.attr("cy"));
            cy = cy < 0 ? svg.clientHeight : cy > svg.clientHeight ? 0 : cy + Math.sin((Number(asteroid.attr('z')) - 90) * (Math.PI / 180));
            return { cx: cx, cy: cy };
        })
            .subscribe(({ cx, cy }) => {
            asteroid.attr("cx", cx);
            asteroid.attr("cy", cy);
        });
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map