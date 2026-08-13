import { Matrix4 } from "../math/matrix4";
import { Vector2 } from "../math/vector";
import { BufferObject, StructArray } from "../resources/cpu.buffer";
import { Component } from "./component";
import { MeshFilterComponent } from "./rendering/mesh.filter.component";
import { MeshInstance, MeshRendererComponent } from "./rendering/mesh.renderer.component";

export class InstanceComponent extends Component {
    bufferIndex = -1;
    instances: StructArray<'Instance'>;

    constructor(
        public instanceCount: number = 1,
        public maxInstanceCount: number = 1,
        public giDisabled: boolean = false,
        public raycastDisabled: boolean = false
    ) {
        super();

        this.instances = new StructArray('Instances', 'Instance', maxInstanceCount);

        for (var i = 0; i < this.maxInstanceCount; i++) {
            this.instances.setStruct(
                i,
                {
                    blasIndex: -1,
                    materialID: -1,
                    matrix: new Matrix4(),
                    transformID: -1,
                    vertexOffset: -1,
                    giDisabled: giDisabled ? 1 : 0,
                    raycastDisabled: raycastDisabled ? 1 : 0,
                    pad: new Vector2()
                }
            )
        }
    }

    blasLocation(index: number) {
        for (var i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, 'blasIndex', index);
        }
    }

    materialLocation(materialIndex: number) {
        for (var i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, 'materialID', materialIndex);
        }
    }

    vertexOffsetLocation(vertexOffset: number) {
        for (var i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, 'vertexOffset', vertexOffset);
        }
    }

    transformLocation(transformIndex: number) {
        for (var i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, 'transformID', transformIndex);
        }
    }

    instanceLocation(
        index: number
    ) {
        this.bufferIndex = index;
       
    }

    toBuffer(): BufferObject {
        return this.instances.data;
    }

    clone(): Component {
        return new InstanceComponent(this.instanceCount, this.maxInstanceCount);
    }

    awake() {
        if (!this.owner.getComponent(MeshFilterComponent)) throw new Error(`MeshFilterComponent is missing on ${this.owner.name}`);
        if (!this.owner.getComponent(MeshRendererComponent)) throw new Error(`MeshRendererComponent is missing on ${this.owner.name}`);

    }


    for(fn: (instance: MeshInstance, index: number) => boolean) {
        const instances = this.instances;

        for (var i = 0; i < this.maxInstanceCount; i++) {
            let instance = instances[i];
            const toContinue = fn(instance, i);
            if (!toContinue) return;
        }
    }

    start() {
       
    }

    update(time: number, delta: number) {
        
    }


}