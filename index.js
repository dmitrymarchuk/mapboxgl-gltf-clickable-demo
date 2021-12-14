mapboxgl.accessToken = 'pk.eyJ1IjoiZGFudmsiLCJhIjoiY2lrZzJvNDR0MDBhNXR4a2xqNnlsbWx3ciJ9.myJhweYd_hrXClbKk8XLgQ';
const origin = [148.9819, -35.39847];
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v10',
	zoom: 18,
	center: origin,
	pitch: 60,
	antialias: true, // create the gl context with MSAA antialiasing, so custom layers are antialiased
});

const tb = new Threebox(
	map,
	map.getCanvas().getContext('webgl'),
	{
		defaultLights: true,
		enableSelectingObjects: true,
	}
);
window.tb = tb;

class GLTFLayer {
	type = 'custom';
	renderingMode = '3d';

	constructor(id, onMouseOver, onMouseOut) {
		this.id = id;
		this.onMouseOver = onMouseOver;
		this.onMouseOut = onMouseOut;
	}

	onAdd(map, mbxContext) {
		var options = {
			obj: './model.glb',
			type: 'gltf',
			scale: 7 ** -3,
			units: 'meters',
			rotation: {x: 90, y: 0, z: 0}, //default rotation
			bbox: false,
			anchor: 'center'
		}

		tb.loadObj(options, (model) => {
			let glb = model.setCoords(origin);
			console.log(model);
			glb.addEventListener('ObjectMouseOver', this.onMouseOver, false);
			glb.addEventListener('ObjectMouseOut', this.onMouseOut, false);
			tb.add(glb);
		})
	};

	render(gl, matrix) {
		tb.update();
	}
}

function over(args) {
	// console.log(args)
}

function out(args) {
	// console.log(args)
}

map.on('style.load', () => {
	map.addLayer(new GLTFLayer('model', over, out));
});

let overObj = null;
map.on('mousemove', e => {
	const intersected = tb.queryRenderedFeatures(e.point)?.map(x => x.object);

	const first = intersected?.find(x => x.name.startsWith("B_FT"))
	if (first) {
		if (overObj && overObj !== first) {
			overObj.material.color.set(0xffffff);
		}
		overObj = first;
		overObj?.material?.color?.set(0xff0000);
	}
});

map.on('click', e => {
	const intersected = tb.queryRenderedFeatures(e.point)?.[0]?.object;
	alert(`Clicked on ${intersected.name}`)
});
