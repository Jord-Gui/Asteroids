"use strict";
function collisionDetectedCircles(x1, y1, x2, y2, r1, r2) {
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), sum = r1 + r2;
    return distance < sum ? true : false;
}
function nextPosition(svg, x, y, velocity, rotation, wrapping) {
    let nextX, nextY;
    if (wrapping) {
        nextX = x < 0 ? svg.clientWidth : x > svg.clientWidth ? 0 : x + velocity * Math.cos((rotation - 90) * (Math.PI / 180));
        nextY = y < 0 ? svg.clientHeight : y > svg.clientHeight ? 0 : y + velocity * Math.sin((rotation - 90) * (Math.PI / 180));
    }
    else {
        nextX = x + velocity * Math.cos((rotation - 90) * (Math.PI / 180));
        nextY = y + velocity * Math.sin((rotation - 90) * (Math.PI / 180));
    }
    return { nextX: nextX, nextY: nextY };
}
//# sourceMappingURL=helperfunctions.js.map