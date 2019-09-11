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
  
  // create a polygon shape for the ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-15,20 15,20 0,-20") // this just creates the points of the ship
    .attr("style","fill:black;stroke:purple;stroke-width:5") // this is just the colour

  const
    // observable for when player hits a key down 
    keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown'),
    // observable for key up
    keyup = Observable.fromEvent<KeyboardEvent>(document, 'keyup'),
    // create a time observable for movement
    timeObservable = Observable.interval(20),
    // current position of the ship
    currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr('transform')) as RegExpExecArray;

  // function to move the ship depending on waht key is pressed
  function moveShip(Key: String, moveFunction: () => {x: Number, y: Number, z: Number}): void {
    keydown
    .filter((e) => e.code === Key && !e.repeat)
    .flatMap(() => {
      return timeObservable
        .takeUntil(keyup)
        .map(() => {
          return {x: String(moveFunction().x), y: String(moveFunction().y), z: String(moveFunction().z)}
        })
    })
    .subscribe(({x, y, z}) => {
      g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`)
    })
  }
  // function to move the ship anti-clockwise
  const moveACW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) - Number(g.attr("rpm"))})
  // function to move the ship clockwise
  const moveCW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) + Number(g.attr("rpm"))})
  // function to move the ship forward
  const moveForward = () => {
    const x = Number(currentShipPosition[1])
    const y = Number(currentShipPosition[2])
    const z = Number(currentShipPosition[3])
    const newX = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+Number(g.attr("velocity"))*Math.cos((z-90)*(Math.PI/180))
    const newY = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+Number(g.attr("velocity"))*Math.sin((z-90)*(Math.PI/180))
    return {x: newX, y: newY, z: z}
  }
  // call the functions to move the ship
  moveShip("KeyW", moveForward);
  moveShip("KeyA", moveACW);
  moveShip("KeyD", moveCW);
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
