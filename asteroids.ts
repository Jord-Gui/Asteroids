// FIT2102 2019 Assignment 1 - Jord Gui 29805457
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/*
  Contents:
    1. Design Details
    2. Variable Declarations
    3. Function Calls
    4. Function Definitions
  
  Other files
    - Helperfunctions.ts
*/

function asteroids() {
  //---------------------------------------------Design Details------------------------------------------------------------------------------------------------
  

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.

  // HTML file contains instructions on how to play the game. 
  /*
    Definition of functions that help with logic calculation can be
    found in the helperfunctions.ts file
  */
  /* 
    Detail of design given below: 
      The...
  */


  //----------------------------------------------Variable Declarations---------------------------------------------------------------------------------------------------
  

  const svg = document.getElementById("canvas")!;

  let 
    // make a group for the spaceship and a transform to move it and rotate it
    // the spaceship is animated by updating the transform and rotate property
    g: Elem = new Elem(svg,'g')
      .attr("transform","translate(300 300) rotate(0)")  
      .attr("velocity", 10)
      .attr("rpm", 10)
      .attr("hitbox", 20)
      .attr("invincible", "true"),
    // create a polygon shape for the ship as a child of the transform group
    ship: Elem = new Elem(svg, 'polygon', g.elem)
      .attr("points","-15,20 0,10 15,20 0,-20")
      .attr("style","fill:yellow;stroke:white;stroke-width:1"),
    // set the number of lives that the ship has
    lives: number = 3,
    // set the initial level
    wave: number = 1,
    // countdown to let players get ready to play at the start of the game
    startTimer = new Elem(svg, 'text')
      .attr('x', 50)
      .attr('y', 100)
      .attr('fill', 'black')
      .attr('font-size', 100)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  // set startTime initial value
  startTimer.elem.textContent = "3"

  const
    // create an interval of time that represents a time step in the game
    mainInterval: Observable<number> = Observable.interval(10),
    // observable for actions that require the game to be over
    gameOver: Observable<number> = mainInterval.filter(_ => lives === 0),
    // observable for when player hits a key down
    keydown: Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").takeUntil(gameOver),
    // observable for when there is a key up
    keyup: Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keyup").takeUntil(gameOver),
    // regex that gets the current position of the ship and stores it in an array
    currentShipPosition: RegExpExecArray = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr("transform")) as RegExpExecArray,
    // array to store lasers after they are created
    lasers: Elem[] = [],
    // array to store asteroids after they are created
    asteroids: Elem[] = [],
    // main observable that represents the passage of time in the game
    mainObservable = mainInterval
      .takeUntil(gameOver)
      .map((time) => {
        return {
          laserArray: lasers,
          asteroidArray: asteroids,
          time: time,
          countDown: startTimer
        }
      })
  

  //----------------------------------------------Function Calls (Animate the Game)---------------------------------------------------------------------------------------------------
  

  // move ship depending on which key is pressed
  moveShip("KeyW", moveShipForward);
  moveShip("KeyA", moveShipACW);
  moveShip("KeyD", moveShipCW);

  // shoot lasers whenever the space bar is pressed down
  createLasers()
  moveLaser()

  // populate the game with asteroids that move randomly
  summonAsteroids()
  moveAsteroid()

  // check that ship has limited invincibility
  removeShipInvincibility()

  // animate the count down timer
  animateCountdownTimer()

  // check if the player has lost the game
  playerLose()

  //----------------------------------------------Function Definitions---------------------------------------------------------------------------------------------------


  // impure function to move the ship anti-clockwise by subtracting from the rotation of the g element
  function moveShipACW() {
    return {x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) - Number(g.attr("rpm"))}
  }
  
  // impure function to move the ship clockwise by adding to the rotation of the g element
  function moveShipCW() {
    return {x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) + Number(g.attr("rpm"))}
  } 
  
  // impure function to move the ship forward in the direction of the front of the ship and wrapping the ship around if it gets to the edge of the canvas
  function moveShipForward() {
    // update ship position and wrap it around if it has reached the edges of the canvas
    const newPosition = nextPosition(svg, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(g.attr("velocity")), Number(currentShipPosition[3]), true)
    return {x: newPosition.nextX, y: newPosition.nextY, rotation: Number(currentShipPosition[3])}
  }
  
  // function to move the ship depending on which key is pressed
  function moveShip(Key: String, moveFunction: () => {x: Number, y: Number, rotation: Number}): void {
    keydown
    .filter((e) => e.code === Key && !e.repeat) // ensure that when key is held down e.repeat keys are filtered out
    .flatMap(() => {
      return mainInterval // while the key is being held down, update the position of the ship
        .takeUntil(keyup)
        .map(() => {
          return {x: String(moveFunction().x), y: String(moveFunction().y), rotation: String(moveFunction().rotation)}
        })
    })
    .subscribe(({x, y, rotation}) => {
      // update the current position of the ship
      g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = rotation})`)
    })
  }

  // function to create lasers whenever the space bar is pressed down
  function createLasers() {
    keydown
    // if ship is invincible, they can't shoot lasers
    // can't hold down space bar and shoot - must keep pressing
    .filter((e) => e.code === "Space" && !(e.repeat) && g.attr("invincible") === "false") 
    .map(() => {
      // create a new laser
      return new Elem(svg, 'circle')
        .attr("cx", currentShipPosition[1])
        .attr("cy", currentShipPosition[2])
        .attr("rotation", currentShipPosition[3])
        .attr("r", 2)
        .attr("velocity", 10)
        .attr("style", "fill:black;fill-opacity:0;stroke:white;stroke-width:1")
      })
    .subscribe((laser) => lasers.push(laser))
  }
  
  // make laser move at each time step
  function moveLaser() {
    mainObservable
    .flatMap(({laserArray, asteroidArray}) => {
      return Observable // turn the lasers array into an observable that can then be flatmapped
        .fromArray(laserArray)
        .map((laser) => {
          // move laser based on direction of when it was initially shot
          const newPosition = nextPosition(svg, Number(laser.attr("cx")), Number(laser.attr("cy")), Number(laser.attr("velocity")), Number(laser.attr("rotation")), false)
          // get the asteroids that the laser has hit
          const collidedAsteroids = asteroidArray.filter((a: Elem) => collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))))
          return {x: newPosition.nextX, y: newPosition.nextY, laser: laser, collidedAsteroids: collidedAsteroids}
        })
    })
    .subscribe(({x, y, laser, collidedAsteroids}) => {
        // move laser and it disappears if it reaches the edge of the map
        x<0 || y<0 || x>svg.clientWidth || y>svg.clientHeight? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)): laser.attr("cx", x) && laser.attr("cy", y);
        // destroy the asteroid and laser if they collide
        collidedAsteroids.forEach((asteroid) => {
          asteroid.elem.remove() // remove asteroid svg element from canvas
          // if the asteroid is larger than a given size, it will split into two smaller ones when destroyed
          if (Number(asteroid.attr("r")) > 25) createAsteroids(2, 25, 1.5)
          asteroids.splice(asteroids.indexOf(asteroid), 1) // remove asteroid object from array
          laser.elem.remove() // remove laser svg element from canvas
          lasers.splice(lasers.indexOf(laser), 1) // remove laser object from array
        })
    })
  }

  // impure function that creates a set number of asteroids that move differently
  function createAsteroids(amount: number, radius: number, velocity: number): void {
    mainInterval
    .takeUntil(mainInterval.filter((t) => t === (amount+1)*10)) // each time step is 10 milliseconds 
    .map(() => {
      // create new asteroid
      return new Elem(svg, "circle")
        .attr("r", radius)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("rotation", Math.floor(Math.random()*360))
        .attr("velocity", velocity)
        .attr("style","fill:black;fill-opacity:0;stroke:white;stroke-width:1") 
    })
    .subscribe((asteroid) => asteroids.push(asteroid))
  }
  
  // function to give the asteroids movement at each time step
  function moveAsteroid() {
    mainObservable
    .flatMap(({asteroidArray}) => {
      return Observable
        .fromArray(asteroidArray) // turn the array of asteroids into an observable which can then be flatmapped 
        .map((asteroid) => {
          // update the position of the asteroid and check if asteroid has reached edge of map, in which case wrap around
          const newPosition = nextPosition(svg, Number(asteroid.attr("cx")), Number(asteroid.attr("cy")), Number(asteroid.attr("velocity")), Number(asteroid.attr("rotation")), true)
          // check if the asteroid has collided with the ship
          const collisionDetected = collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr("r")), Number(g.attr("hitbox")))
          return {x: newPosition.nextX, y: newPosition.nextY, asteroid: asteroid, collision: collisionDetected}
        })
    })
    .subscribe(({x, y, asteroid, collision}) => {
      // the ship loses a life if it collides with an asteroid
      if (collision && (g.attr("invincible") === "false")) {
        lives-- 
        document.getElementById("lives")!.innerHTML = `Lives: ${"🚀".repeat(lives)}`
        if (lives > 0) resetShip()
      }
      // update position of asteroid
      else asteroid.attr("cx", x).attr("cy", y)
    })
  }
  
  // impure function that resets position of ship
  function resetShip() {
    g // move ship back to starting position
      .attr("transform","translate(300 300) rotate(0)") 
      // turn ship invincible in case asteroids are at starting position
      .attr("invincible", "true")
    // Move ship back to starting position
    currentShipPosition[1] = "300", currentShipPosition[2] = "300", currentShipPosition[3] = "0"
    // change ship colour to represent invincibility
    ship.attr("style","fill:yellow;stroke:white;stroke-width:1")
  }

  // ensure ship is only invincible for 3 seconds max at a time
  function removeShipInvincibility() {
    mainObservable
    // limitations - shield doesn't last exactly 3 secs if ship
    // dies in between the interval. Refactor if time permits
    .filter(({time}) => time%3000 === 0 && g.attr("invincible") === "true")
    .subscribe(() => {
      g.attr("invincible", "false")
      ship.attr("style","fill:black;fill-opacity:0;stroke:white;stroke-width:1")
    })
  }
  
  // animate the countdown timer 
  function animateCountdownTimer() {
    mainObservable
    .filter(({time}) => time%1000 === 0)
    // refactor if time permits
    .subscribe(({time, countDown}) => {
      if (time === 1000) {
        countDown.elem.textContent = "2"
      } 
      else if (time === 2000) {
        countDown.elem.textContent = "1"
      }
      else if (time === 3000) {
        countDown.elem.textContent = "FIGHT!"
      }
      else {
        countDown.elem.remove()
      }
    })
  }

  // increment level if all asteroids are destroyed
  function summonAsteroids() {
    mainObservable
    // asteroids need time to be created so check if asteroid array is empty
    // in intervals to allow for at least one asteroid to be added to the array
    // or else bugs happen
    .filter(({time, asteroidArray}) => time%30 === 0 && asteroidArray.length === 0)
    .subscribe(() => {
      if (wave <= 3) {
        document.getElementById("waves")!.innerHTML = `Wave: ${wave}`
        createAsteroids(wave*2, 50, 1)
        wave += 1
      }
      else {
        playerWin()
      }
    })
  }

  // impure function to display You Win message when all waves are cleared
  function playerWin() {
      // display You Win message
      document.getElementById("lives")!.innerHTML = "YOU WIN 💚"
      document.getElementById("lives")!.style.color = "green"
      // change colour of ship to green
      ship.attr("style", "fill:green;stroke:white;stroke-width:1")
      // end the game
      lives = 0
  }

  // display You Lose message if the player loses
  function playerLose() {
    gameOver
    .filter(() => asteroids.length > 0) // check that the player is the one that lost
    .subscribe(() => {
      // display Game Over message
      document.getElementById("lives")!.innerHTML = "YOU LOSE 😡"
      document.getElementById("lives")!.style.color = "red"
      // change colour of ship to red
      ship.attr("style", "fill:red;stroke:white;stroke-width:1")
    }) 
  }
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
