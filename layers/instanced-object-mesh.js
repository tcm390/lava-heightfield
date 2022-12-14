import * as THREE from "three";
import {PolygonMesh, PolygonPackage} from "../meshes/polygon-mesh.js";
import {
  SpritesheetMesh,
  SpritesheetPackage,
} from "../meshes/spritesheet-mesh.js";

//

//

const spriteLodCutoff = 8;
const meshLodSpecs = {
  1: {
    targetRatio: 1,
    targetError: 0,
  },
  2: {
    targetRatio: 0.5,
    targetError: 0.01,
  },
  4: {
    targetRatio: 0.3,
    targetError: 0.05,
  },
  8: {
    targetRatio: 0.15,
    targetError: 0.1,
  },
};
const maxNumGeometries = 16;
const maxInstancesPerGeometryPerDrawCall = 256;
const maxDrawCallsPerGeometry = 256;

//

export class InstancedObjectMesh extends THREE.Object3D {
  constructor({instance, physics, urls, shadow}) {
    super();

    this.urls = urls;

    this.polygonMesh = new PolygonMesh({
      instance,
      lodCutoff: spriteLodCutoff,
      maxNumGeometries,
      maxInstancesPerGeometryPerDrawCall,
      maxDrawCallsPerGeometry,
      shadow
    });
    this.add(this.polygonMesh);

    this.spritesheetMesh = new SpritesheetMesh({
      instance,
      lodCutoff: spriteLodCutoff,
    });
    this.add(this.spritesheetMesh);

    this.physics = physics;
  }

  update() {
    this.spritesheetMesh.update();
  }

  addChunk(chunk, chunkResult) {
    this.polygonMesh.addChunk(chunk, chunkResult);
    this.spritesheetMesh.addChunk(chunk, chunkResult);
  }

  removeChunk(chunk) {
    this.polygonMesh.removeChunk(chunk);
    this.spritesheetMesh.removeChunk(chunk);
  }

  async waitForLoad() {
    const [polygonPackage, spritesheetPackage] = await Promise.all([
      PolygonPackage.loadUrls(this.urls, meshLodSpecs, this.physics),
      SpritesheetPackage.loadUrls(this.urls),
    ]);
    this.polygonMesh.setPackage(polygonPackage);
    this.spritesheetMesh.setPackage(spritesheetPackage);
  }
}