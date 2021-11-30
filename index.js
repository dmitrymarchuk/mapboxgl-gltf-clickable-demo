const THREE = window.THREE;

const {MercatorCoordinate} = mapboxgl;

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFudmsiLCJhIjoiY2lrZzJvNDR0MDBhNXR4a2xqNnlsbWx3ciJ9.myJhweYd_hrXClbKk8XLgQ';
const modelOrigin = [148.9819, -35.39847];
// const modelOrigin = [0, 0];
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v10',
	zoom: 18,
	center: modelOrigin,
	pitch: 60,
	antialias: true, // create the gl context with MSAA antialiasing, so custom layers are antialiased
});


class GLTFLayer {
	type = 'custom';
	renderingMode = '3d';

	constructor(id) {
		this.id = id;
	}

	onAdd(map, gl) {
		this.camera = new THREE.Camera();

		this.scene = new THREE.Scene();

		const centerLngLat = map.getCenter();
		this.center = MercatorCoordinate.fromLngLat(centerLngLat, 0);
		const {x, y, z} = this.center;
		const s = this.center.meterInMercatorCoordinateUnits() * 7 ** -3;
		const scale = new THREE.Matrix4().makeScale(s, s, s);

		const rotation = new THREE.Matrix4().multiplyMatrices(
			new THREE.Matrix4().makeRotationX(Math.PI / 2),
			new THREE.Matrix4().makeRotationY(0),
			new THREE.Matrix4().makeRotationZ(0)
		);

		this.cameraTransform =
			new THREE.Matrix4().multiplyMatrices(scale, rotation).setPosition(x, y, z);

		const light = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(light);

// use the three.js GLTF loader to add the 3D model to the three.js scene
		const loader = new THREE.GLTFLoader();
		loader.setPath('./')
		loader.load(
			'model.glb',
			(gltf) => {
				this.buildings = gltf.scene.children[2].children;
				this.scene.add(gltf.scene);
			},
		);
		this.map = map;

// use the Mapbox GL JS map canvas for three.js
		this.renderer = new THREE.WebGLRenderer({
			canvas: map.getCanvas(),
			context: gl,
			antialias: true,
		});

		this.raycaster = new THREE.Raycaster();
		this.raycaster.near = -1;
		this.raycaster.far = 1e6;

		this.renderer.autoClear = false;
		this.renderer.gammaOutput = true;
	};

	render(gl, matrix) {
		const m = new THREE.Matrix4().fromArray(matrix);

		this.camera.projectionMatrix = m.multiply(this.cameraTransform);
		this.camera.projectionMatrixInverse = new THREE.Matrix4().copy(this.camera.projectionMatrix).invert();
		this.renderer.resetState();
		this.renderer.render(this.scene, this.camera);
		this.map.triggerRepaint();
	}

	intersects(point) {
		const origin = new THREE.Vector3().unproject(this.camera);

		const mouse = new THREE.Vector3(
			(point.x / this.map.transform.width) * 2 - 1,
			1 - (point.y / this.map.transform.height) * 2,
			1
		).unproject(this.camera);
		const direction = mouse.clone().sub(origin).normalize();
		// raycaster.setFromCamera(mouse, this.camera);
		this.raycaster.set(origin, direction);

		return this.raycaster.intersectObjects(this.buildings, false);
	}
}

const customLayer = new GLTFLayer('model');

map.on('style.load', () => {
	map.addLayer(customLayer);
});

map.on('mousemove', e => {
	const intersected = customLayer.intersects(e.point);

	const first = intersected?.[0]?.object;
	first?.material?.color?.set(0xff0000);

	customLayer.buildings.filter(x => x !== first).forEach((x) => {
		x.material.color.set(0xffffff);
	})
});

map.on('click', e => {
	const intersected = customLayer.intersects(e.point)?.[0]?.object;
	alert(`Clicked on ${intersected.name}`)
});
