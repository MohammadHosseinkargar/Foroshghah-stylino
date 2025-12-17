declare module "three" {
  export type Euler = any;
  export type Vector3 = any;

  export class Object3D {
    position: any;
    rotation: any;
    [key: string]: any;
  }

  export class Group extends Object3D {}
  export class Mesh extends Object3D {}

  export class Light extends Object3D {
    intensity?: number;
    color?: any;
  }

  export class AmbientLight extends Light {}
  export class PointLight extends Light {}
  export class DirectionalLight extends Light {}

  export class Material {
    [key: string]: any;
  }

  export class MeshStandardMaterial extends Material {}
}
