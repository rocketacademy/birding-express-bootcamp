const irisLeft = document.querySelector('div.iris-left');
const irisRight = document.querySelector('div.iris-right');

// first interval hasn't started yet
let interval = null;

// every 3 seconds, i want the eyes to move , unless when the mouse moves
const startInterval = function () {
  // any previous interval should stop first
  clearInterval(interval);
  interval = setInterval(() => {
    // get a random place
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    // move irises to that place
    moveEye(irisLeft, x, y);
    moveEye(irisRight, x, y);
  }, 3000);
};

// function that controls each iris based on the mouse position
// depends on the 1) eye 2) mouse moving horizontally across the page 3) mouse moving vertically on the page
const moveEye = function (tag, mouseX, mouseY) {
  // doing some trigonometry here ~~~

  //   1) get center of the eye
  const eyeMidX = tag.getBoundingClientRect().left;
  const eyeMidY = tag.getBoundingClientRect().top;

  // 2) find the difference between the eye and the mouse
  const diffX = mouseX - eyeMidX;
  const diffY = mouseY - eyeMidY - window.pageYOffset;

  // pythagorous theorem to find the diagonal
  const diff = Math.sqrt(diffX * diffX + diffY * diffY);

  // what is the capped radius? maximum is 3px
  const radius = Math.min(3, diff);

  // tan in math
  const angle = Math.atan2(diffY, diffX);

  // We want to position the iris so that it stays within the eyeball, and so we “cap” — or in other words, limit — our X, Y, and radius values, so that they stay within the actual size of the eyeball.
  const cappedX = radius * Math.cos(angle);
  const cappedY = radius * Math.sin(angle);

  const eyeTag = tag.querySelector('div');

  eyeTag.style.left = `${cappedX}px`;
  eyeTag.style.top = `${cappedY}px`;
};

// when we load page this happens
startInterval();

// wehenver we move the mouse, it will get the coordinates of the mouse (pageX, pageY)
document.addEventListener('mousemove', (event) => {
  startInterval(); // after 3 seconds it will start
  moveEye(irisLeft, event.pageX, event.pageY); // tag, mouseX, mouseY
  moveEye(irisRight, event.pageX, event.pageY);
});
