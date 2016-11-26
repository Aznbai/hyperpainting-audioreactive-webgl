if (!Detector.webgl) Detector.addGetWebGLMessage();
var colors = new Array(
  [62, 35, 255], [60, 255, 60], [255, 35, 98], [45, 175, 230], [255, 0, 255], [255, 128, 0]);
var color1, color2;
var step = 0;
var newColor, newColor1;
var colorIndices = [0, 1, 2, 3];
var gradientSpeed = 0.01;
var splineCamera;
var text, plane;
var targetRotation = 0;
var targetRotationOnMouseDown = 0;
var mouseX = 0;
var mouseXOnMouseDown = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var binormal = new THREE.Vector3();
var normal = new THREE.Vector3();
var extrudePath = new THREE.Curves.TrefoilKnot();
var closed2 = true;
var parent;
var tube, tubeMesh;
var animation = false;
var lookAhead = true;
var scale = 6;
var showCameraHelper = false;
var container, stats;
var params = {
  bassFreq: 30,
  middleFreq: 50,
  trebleFreq: 90,
  looptime: 400000,
  offset: 232,
  sens: 65,
  smooth: 0.75,
  projection: 'normal',
  autoRotate: true,
  reflectivity: 1.0,
  background: false,
  exposure: 0.1,
  gemColor: 'Green'
};
var camera, scene, renderer, controls, objects = [];
var hdrCubeMap;
var composer;
var gemBackMaterial, gemFrontMaterial;
var hdrCubeRenderTarget;
var pointLight1, pointLight2, pointLight3, pointLight4;
//sound styles
var values = {
  height: 80,
  pathCount: 10,
  cloneCount: 10,
  step: 4,
  stepPlus: 25,
  rotateVol: 0.001,
  speedFactor: 0.05,
  bassfreq: 10,
  midfreq: 20,
  trebfreq: 50,
  sens: 63,
  smoothing: 0.75
};
var volume = 0.1;
var offsetX = 0.1;
var offsetY = 0.1;
var high = 2;
var offsetxy = [1, 1];
var bass = 1;
var middle = 1;
var treble = 1;
init();
animate();
animateCamera();

function addTube() {
  var value = 'GrannyKnot';
  var segments = 200;
  var radiusSegments = 300;
  closed2 = true;
  if (tubeMesh) parent.remove(tubeMesh);
  extrudePath = new THREE.Curves.GrannyKnot();
  tube = new THREE.TubeGeometry(extrudePath, segments, 2, radiusSegments, closed2);
  addGeometry(tube, 0xff00ff);
  setScale();
}

function setScale() {
  tubeMesh.scale.set(scale, scale, scale);
}

function addGeometry(geometry, color) {
  // 3d shape
  tubeMesh = THREE.SceneUtils.createMultiMaterialObject(geometry, [
    new THREE.MeshLambertMaterial({
      opacity: 0, //makes tube skin color invisible
      color: color,
      transparent: true,
      refractionRatio: 50
    }),
    new THREE.MeshBasicMaterial({
      color: 0x00000,
      opacity: 0,
      wireframe: true,
      wireframeLinewidth: 1,
      transparent: true,
      refractionRatio: 50
    })
  ]);
  parent.add(tubeMesh);
}

function animateCamera() {
  animation = animation === false;
  lookAhead = false;
}
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
window.URL = window.URL || window.webkitURL;
context = new AudioContext;
navigator.getUserMedia({
  audio: true
}, startUserMedia, function(e) {});

function startUserMedia(stream) {
  source = context.createMediaStreamSource(stream);
  analyser = context.createAnalyser();
  source.connect(analyser);
  analyser.smoothingTimeConstant = values.smoothing;
  analyser.minDecibels = -values.sens;
  // analyser.connect(context.destination);
  setInterval(sampleAudioStream, 50);
}

function sampleAudioStream() {
  freqData = new Uint8Array(analyser.frequencyBinCount);
  volData = new Uint8Array(128);
  analyser.getByteFrequencyData(freqData);
  analyser.getByteFrequencyData(volData);
  // calc bass
  for (var i = 0; i < params.bassFreq; i++) {
    bass = freqData[i] / params.bassFreq;
  }
  bass = Math.floor(bass / 2) + 1;
  // calc middle
  for (var i = params.bassFreq; i < params.middleFreq; i++) {
    middle = freqData[i] / params.middleFreq;
  }
  middle = Math.floor(middle / 2) + 1;
  // calc treble
  for (var i = params.middleFreq; i < params.trebleeFreq; i++) {
    treble = freqData[i] / params.trebleeFreq;
  }
  treble = Math.floor(treble / 2) + 1;
  // calc volume
  var total = 0;
  for (var i in volData) {
    total += volData[i];
  }
  volume = total;
}
var twStart = {
  x: 0,
  y: 300
};
var twEnd = {
  x: 400,
  y: 50
};

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);
  // addTube(GrannyKnot);
  container = document.createElement('div');
  document.body.appendChild(container);
  // animateCamera(true);
  container.appendChild(info);
  // camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
  scene = new THREE.Scene();
  var light = new THREE.DirectionalLight(0xffffff);
  parent = new THREE.Object3D();
  splineCamera = new THREE.PerspectiveCamera(84, window.innerWidth / window.innerHeight, 0.01, 1000);
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  // camera.position.set(0, 50, 500);
  light.position.set(0, 0, 1);
  parent.position.y = 100;
  parent.scale.set(0.5, 0.5, 0.5);
  scene.add(parent);
  scene.add(light);
  parent.add(splineCamera);
  addTube();
  generateMorphTargets(tubeMesh, tube);
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  stats = new Stats();
  container.appendChild(stats.dom);
  // renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  //
  gemBackMaterial = new THREE.MeshPhysicalMaterial({
    map: null,
    color: 0x0000ff,
    metalness: 1.0,
    roughness: 0,
    opacity: 0.05,
    side: THREE.BackSide,
    transparent: true,
    shading: THREE.SmoothShading,
    envMapIntensity: 5,
    premultipliedAlpha: true
      // TODO: Add custom blend mode that modulates background color by this materials color.
  });
  gemFrontMaterial = new THREE.MeshPhysicalMaterial({
    map: null,
    color: 0x000055,
    metalness: 0.0,
    roughness: 0,
    opacity: 0.05,
    side: THREE.FrontSide,
    transparent: true,
    shading: THREE.SmoothShading,
    envMapIntensity: 102,
    premultipliedAlpha: true
  });
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(item, loaded, total) {
    console.log(item, loaded, total);
  };
  var loader = new THREE.OBJLoader(manager);
  loader.load('objects/1.obj', function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = gemBackMaterial;
        var second = child.clone();
        second.material = gemFrontMaterial;
        var parent = new THREE.Group();
        parent.add(second);
        parent.add(child);
        scene.add(parent);
        objects.push(parent);
      }
    });
  });
  var genCubeUrls = function(prefix, postfix) {
    return [
      prefix + 'px' + postfix, prefix + 'nx' + postfix,
      prefix + 'py' + postfix, prefix + 'ny' + postfix,
      prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
  };
  var hdrUrls = genCubeUrls("hdr/", ".hdr");
  new THREE.HDRCubeTextureLoader().load(THREE.UnsignedByteType, hdrUrls, function(hdrCubeMap) {
    var pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap);
    pmremGenerator.update(renderer);
    var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
    pmremCubeUVPacker.update(renderer);
    hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
    gemFrontMaterial.envMap = gemBackMaterial.envMap = hdrCubeRenderTarget.texture;
    gemFrontMaterial.needsUpdate = gemBackMaterial.needsUpdate = true;
  });
  // Lights
  scene.add(new THREE.AmbientLight(0x222222));
  pointLight1 = new THREE.PointLight(0xff0000);
  pointLight1.position.set(150, 10, 0);
  pointLight1.castShadow = false;
  scene.add(pointLight1);
  pointLight2 = new THREE.PointLight(0x00ff00);
  pointLight2.position.set(-150, 0, 0);
  scene.add(pointLight2);
  pointLight3 = new THREE.PointLight(0x0000ff);
  pointLight3.position.set(0, -10, -150);
  scene.add(pointLight3);
  pointLight4 = new THREE.PointLight(0xffffff);
  pointLight4.position.set(0, 0, 350);
  scene.add(pointLight4);
  // light representation
  var sphere1 = new THREE.SphereGeometry(50, 16, 16); //radius, widthSegments, heightSegments
  var sphere2 = new THREE.SphereGeometry(50, 16, 16);
  var sphere3 = new THREE.SphereGeometry(50, 16, 16);
  var sphere4 = new THREE.SphereGeometry(50, 16, 16);
  var mesh1 = new THREE.Mesh(sphere1, new THREE.MeshBasicMaterial({
    color: 0xff0000
  }));
  var mesh2 = new THREE.Mesh(sphere2, new THREE.MeshBasicMaterial({
    color: 0x00ff00
  }));
  var mesh3 = new THREE.Mesh(sphere3, new THREE.MeshBasicMaterial({
    color: 0x0000ff
  }));
  var mesh4 = new THREE.Mesh(sphere4, new THREE.MeshBasicMaterial({
    color: 0xffff00
  }));
  mesh1.scale.set(0.5, 0.5, 0.5);
  mesh2.scale.set(0.5, 0.5, 0.5);
  mesh3.scale.set(0.5, 0.5, 0.5);
  mesh4.scale.set(0.5, 0.5, 0.5);
  pointLight1.add(mesh1);
  pointLight2.add(mesh2);
  pointLight3.add(mesh3);
  pointLight4.add(mesh4);
  renderer.shadowMap.enabled = true;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  // controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.target.set(0, 0, 0);
  // controls.update();
  window.addEventListener('resize', onWindowResize, false);
  var gui = new dat.GUI();
  gui.add(params, 'sens', 0.01, 127);
  gui.add(params, 'smooth', 0, 1.0);
  gui.add(params, 'bassFreq', 0, 50);
  gui.add(params, 'middleFreq', 30, 70);
  gui.add(params, 'trebleFreq', 50, 100);
  gui.add(params, 'looptime', 4000, 600000);
  gui.add(params, 'offset', 1, 300);
  gui.add(params, 'reflectivity', 0, 100);
  gui.add(params, 'exposure', 0.1, 0.5);
  // gui.add(params, 'autoRotate');
  // gui.add(params, 'gemColor', ['Blue', 'Green', 'Red', 'White', 'Black']);
  gui.open();
  // console.log("number of obj is" + l);
}

function onWindowResize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  splineCamera.aspect = width / height;
  splineCamera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
// function onDocumentMouseDown(event) {
//   event.preventDefault();
//   // renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
//   renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
//   renderer.domElement.addEventListener('mouseout', onDocumentMouseOut, false);
//   mouseXOnMouseDown = event.clientX - windowHalfX;
//   targetRotationOnMouseDown = targetRotation;
// }
function updateGradient() {
  var c0_0 = colors[colorIndices[0]];
  var c0_1 = colors[colorIndices[1]];
  var c1_0 = colors[colorIndices[2]];
  var c1_1 = colors[colorIndices[3]];
  var istep = 1 - step;
  var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
  var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
  var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
  color1 = "rgb(" + r1 + "," + g1 + "," + b1 + ")";
  var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
  var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
  var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
  color2 = "rgb(" + r2 + "," + g2 + "," + b2 + ")";
  step += gradientSpeed;
  if (step >= 1) {
    step %= 1;
    colorIndices[0] = colorIndices[1];
    colorIndices[2] = colorIndices[3];
    //pick two new target color indices
    //do not pick the same as the current one
    colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
    colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
  }
  // console.clear();
  // console.log("color1: " + color1, "color2: " + color2);
}

function render() {
  var timer = Date.now() * 0.00025;
  var time = Date.now();
  var looptime = params.looptime;
  var t = (time % looptime) / looptime;
  var pos = tube.parameters.path.getPointAt(t);
  pos.multiplyScalar(scale);
  // interpolation
  var segments = tube.tangents.length;
  var pickt = t * segments;
  var pick = Math.floor(pickt);
  var pickNext = (pick + 1) % segments;
  binormal.subVectors(tube.binormals[pickNext], tube.binormals[pick]);
  binormal.multiplyScalar(pickt - pick).add(tube.binormals[pick]);
  var dir = tube.parameters.path.getTangentAt(t);
  var offset = params.offset + Math.sin(middle + bass) * 10;
  normal.copy(binormal).cross(dir);
  // We move on a offset on its binormal
  pos.add(normal.clone().multiplyScalar(offset));
  if (gemBackMaterial !== undefined && gemFrontMaterial !== undefined) {
    // gemFrontMaterial.reflectivity = gemBackMaterial.reflectivity = params.reflectivity; // newColor = gemBackMaterial.color; // switch (params.gemColor) { // case 'Blue': // newColor = new THREE.Color(0x000088); // break; // case 'Red': // newColor = new THREE.Color(0x880000); // break; // case 'Green': // newColor = new THREE.Color(0x008800); // break; // case 'White': // newColor = new THREE.Color(0x888888); // break; // case 'Black': // newColor = new THREE.Color(0x0f0f0f); // break; // }
    if (bass > 1) {
      newColor = new THREE.Color(color1);
      gemBackMaterial.color = gemFrontMaterial.color = newColor;
    }
  }
  if (middle > 1) {
    newColor1 = new THREE.Color(color2);
    tubeMesh.color = newColor1;
  }
  renderer.toneMappingExposure = params.exposure;
  if (params.autoRotate) {
    for (var i = 0, l = objects.length; i < l; i++) {
      var object = objects[i];
      object.rotation.y += 0.001 + bass / 1000;
    }
  }
  splineCamera.position.copy(pos);
  var lookAt = tube.parameters.path.getPointAt((t + 50 / tube.parameters.path.getLength()) % 1).multiplyScalar(scale);
  // Camera Orientation 2 - up orientation via normal
  if (lookAhead) lookAt.copy(pos).add(dir);
  splineCamera.matrix.lookAt(splineCamera.position, lookAt, normal);
  splineCamera.rotation.setFromRotationMatrix(splineCamera.matrix, splineCamera.rotation.order);
  //parent
  parent.rotation.y += (targetRotation - parent.rotation.y) * 0.05;
  parent.rotation.x += (targetRotation - parent.rotation.x) * 0.05;
  parent.rotation.z += (targetRotation - parent.rotation.z) * 0.05;
  renderer.render(scene, animation === true ? splineCamera : camera);
  //light
  pointLight1.position.x = 1000 * Math.cos(timer + bass);
  pointLight1.position.y = 1000 * Math.tan(timer + bass);
  pointLight1.position.z = 1000 * Math.sin(timer + bass);
  pointLight2.position.x = 800 * Math.tan(timer);
  pointLight2.position.y = 800 * Math.sin(timer);
  pointLight2.position.z = 800 * Math.cos(timer);
  pointLight3.position.x = 600 * Math.cos(timer);
  pointLight3.position.y = 600 * Math.sin(timer);
  pointLight3.position.z = 600 * Math.tan(timer);
  pointLight4.position.x = 1200 * Math.sin(timer);
  pointLight4.position.y = 1200 * Math.cos(timer);
  pointLight4.position.z = 1200 * Math.tan(timer);
}
// function renderer end
function animate() {
  updateGradient();
  requestAnimationFrame(animate);
  stats.begin();
  render();
  stats.end();
  // console.log("bass" + bass + " middle" + middle + " treble" + treble);
}