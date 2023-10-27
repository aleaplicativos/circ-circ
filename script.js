const canvas = document.querySelector("canvas")

//
// vector utils
//

const Vec = (x, y) => ({ x, y })
Vec.add = (a, b) => Vec(a.x + b.x, a.y + b.y)
Vec.sub = (a, b) => Vec(a.x - b.x, a.y - b.y)
Vec.len = (v) => Math.hypot(v.x, v.y)
Vec.scale = (v, s) => Vec(v.x * s, v.y * s)
Vec.norm = (v) => Vec.scale(v, 1 / Vec.len(v))

//
// params (scale factors)
//

const SF_BG_CIRC_RADIUS = 0.2
const SF_MAIN_CIRC_RADIUS = 0.4
const SF_MAIN_CIRC_RADIUS_MIN = 0.2
const SF_INTERSECTION_CIRC_RADIUS = 0.05

// 
// main
//

let ctx;
let ref;
const pointer = Vec(0, 0)
const main_circle = { c: Vec(-innerWidth / 2, 0), r: 0 } // slide in
const circles = []

function init() {
  canvas.width = innerWidth
  canvas.height = innerHeight
  ref = Math.min(canvas.width, canvas.height)
  ctx = canvas.getContext("2d")
  ctx.translate(canvas.width / 2, canvas.height / 2) // tr origin
  set_circles()
  pointer.x = 0
  pointer.y = 0
  main_circle.r = (SF_MAIN_CIRC_RADIUS * ref)
}

function on_resize() {
  init()
}

function on_pointer_move(e) {
  pointer.x = e.offsetX - e.target.width / 2
  pointer.y = e.offsetY - e.target.height / 2
}

function on_wheel(e) {
  main_circle.r = Math.max(
    (SF_MAIN_CIRC_RADIUS_MIN * ref),
    main_circle.r + Math.sign(e.deltaY) * (ref * 0.1)
  )
}

function tick() {
  requestAnimationFrame(tick)

  ctx.fillStyle = "#fff3"
  ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
  ctx.fillStyle = "#000"

  circles.forEach((c) => {
    const ps = circ_circ_intersections(c, main_circle)
    if (ps.length > 0) draw_intersections(ps)
  });

  main_circle.c = Vec.add(
    main_circle.c,
    Vec.scale(Vec.sub(pointer, main_circle.c), 0.05)
  );
}

function set_circles() {
  circles.length = 0
  const d = 2 * (SF_BG_CIRC_RADIUS * ref)
  const r = d * (0.5 + 0.06) // overlap 
  for (let x = -canvas.width / 2; x < canvas.width; x += d) {
    for (let y = -canvas.height / 2; y < canvas.height; y += d) {
      circles.push({ c: Vec(x, y), r });
    }
  }
}

function draw_intersections([p0, p1]) {
  const r = (SF_INTERSECTION_CIRC_RADIUS * ref)

  ctx.beginPath()
  ctx.ellipse(p0.x, p0.y, r, r, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(p1.x, p1.y, r, r, 0, 0, Math.PI * 2)
  ctx.fill()
}

addEventListener("resize", on_resize)
addEventListener("pointermove", on_pointer_move)
addEventListener("wheel", on_wheel)
requestAnimationFrame(tick)
init()

// ---
// https://stackoverflow.com/a/3349134
// intersections: "from p2, offset +-h along dir perp to p0p1"
// ---

function circ_circ_intersections(circ0, circ1) {
  const { c: p0, r: r0 } = circ0
  const { c: p1, r: r1 } = circ1

  const p0p1 = Vec.sub(p1, p0)
  const d = Vec.len(p0p1)

  if (d > r0 + r1) return [] // no soln
  if (d < Math.abs(r0 - r1)) return [] // no soln
  if (d == 0 && r0 == r1) return [] // inf. soln

  const a = (r0 ** 2 - r1 ** 2 + d ** 2) / (2 * d)
  const h = Math.sqrt(circ0.r ** 2 - a ** 2)
  const p2 = Vec.add(p0, Vec.scale(p0p1, a / d)) // p2
  const perp_dir = Vec.norm(Vec(p0p1.y, -p0p1.x)) // dir perp to p0p1
  return [
    Vec.add(p2, Vec.scale(perp_dir, h)), // p3
    Vec.add(p2, Vec.scale(perp_dir, -h)) // another p3
  ]
}