// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.
  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
    .attr("transform","translate(300 300) rotate(0)")  
    .attr("velocity", 20)
    .attr("rpm", 20)
    .attr("x", 300) // x coordinate of translate
    .attr("y", 300) // y coordinate of translate
    .attr("z", 0) // rotation 
  
  // create a polygon shape for the space ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-15,20 15,20 0,-20") // this just creates the points of the ship
    .attr("style","fill:black;stroke:purple;stroke-width:5") // this is just the colour

  const keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown'); // it is the actual 'document' that takes keyboard events, not just svg
  
  // move the ship around by updating the translate and rotate coordinates 
  keydown
    .filter(e => e.code === "KeyA" || e.code === "KeyD" || e.code === "KeyW") // e.keyCode==96 is depracated
    .scan({x: 300, y: 300, z: 0}, ({x, y, z}, e) => {
      if (e.code === "KeyW") {
        // if the x coordinate has reached the edges of svg, wrap it around
        x = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+Number(g.attr("velocity"))*Math.cos((z-90)*(Math.PI/180)) // get front of ship in relation to the rotation
        // if the y coordinate has reached the edges svg, wrap it around
        y = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+Number(g.attr("velocity"))*Math.sin((z-90)*(Math.PI/180)) // this ensures the ship moves in the direction it is facing
        g.attr("x", x) // set x coordinate of translate to be used for shooting
        g.attr("y", y) // set y coordinate of translate to be used for shooting
        return {x: x, y: y, z: z}
      }
      else if (e.code === "KeyA") {
        z = z-Number(g.attr("rpm")) // set z coordinate of translate to be used for shooting
        g.attr("z", z)
        return {x: x, y: y, z: z} // rotate anti-clockwise
      }
      else if (e.code === "KeyD") {
        z = z+Number(g.attr("rpm")) // set z coordinate of translate to be used for shooting
        g.attr("z", z)
        return {x: x, y: y, z: z} // rotate clockwise
      }
      else {
        return {x: x, y: y, z: z}
      }
    })
    .subscribe(value => g.attr("transform", `translate(${value.x} ${value.y}) rotate(${value.z})`));

  keydown
    .filter(e => e.code === "Space")
    .map(() => {
      // create a new laser
      return new Elem(svg, 'rect')
        .attr("x", g.attr("x"))
        .attr("y", g.attr("y"))
        .attr("z", g.attr("z"))
        .attr("width", 2)
        .attr("height", 4)
        .attr("style", "fill:pink;stroke:purple;stroke-width:1")
    })
    .subscribe((laser) => {
      // shoot it out from the ship in the direction that the ship is facing
      Observable.interval(1)
      .subscribe(() => {
        // move laser based on the direction when it was initially shot
        let x = Number(laser.attr('x')) + Math.cos((Number(laser.attr('z'))-90)*(Math.PI/180))
        let y = Number(laser.attr('y')) + Math.sin((Number(laser.attr('z'))-90)*(Math.PI/180))
        // lasesr disappears if it reaches the edge of the map
        x<0 || y<0 || x>svg.clientWidth || y>svg.clientHeight? laser.elem.remove(): laser.attr('x', x) && laser.attr('y', y);
      });
    })
  
  // create asteroids in set intervals 
  Observable.interval(100)
    .takeUntil(Observable.interval(500))
    .map(() => {
      // create a new asteroid
      return new Elem(svg, 'circle')
        .attr("r", 25)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("z", Math.floor(Math.random()*360))
        .attr("style","fill:pink;stroke:purple;stroke-width:1") 
    })
    .subscribe((asteroid) => {
      // move the asteroid
      Observable.interval(10)
      .subscribe(() => {
        // check if asteroid has reached edge of map, in which case wrap around
        let cx = Number(asteroid.attr("cx"))
        cx = cx < 0? svg.clientWidth: cx > svg.clientWidth? 0: cx + Math.cos((Number(asteroid.attr('z'))-90)*(Math.PI/180))
        let cy = Number(asteroid.attr("cy"))
        cy = cy < 0? svg.clientHeight: cy > svg.clientHeight? 0: cy + Math.sin((Number(asteroid.attr('z'))-90)*(Math.PI/180))
        // update asteroid position
        asteroid.attr("cx", cx)
        asteroid.attr("cy", cy)
      })
    })
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
