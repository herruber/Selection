import { Matrix4 } from "../math/matrix4";
import { Vector2 } from "../math/vector";
import { BufferObject, StructArray } from "../resources/cpu.buffer";
import { Component } from "./component";
import { MeshFilterComponent } from "./rendering/mesh.filter.component";
import {
    MeshInstance,
    MeshRendererComponent
} from "./rendering/mesh.renderer.component";

export class InstanceComponent extends Component {
    bufferIndex = -1;

    instances: StructArray<"Instance">;

    constructor(
        public instanceCount: number = 1,
        public readonly maxInstanceCount: number = 1,
        public giDisabled: boolean = false,
        public raycastDisabled: boolean = false
    ) {
        super();

        this.instances = new StructArray(
            "Instances",
            "Instance",
            maxInstanceCount
        );

        for (let i = 0; i < this.maxInstanceCount; i++) {
            this.instances.setStruct(i, {
                blasIndex: -1,
                materialID: -1,
                matrix: new Matrix4(),
                transformID: -1,
                vertexOffset: -1,
                giDisabled: giDisabled ? 1 : 0,
                raycastDisabled: raycastDisabled ? 1 : 0,
                pad: new Vector2()
            });
        }
    }

    setBlasIndex(index: number) {
        for (let i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, "blasIndex", index);
        }
    }

    setMaterialIndex(index: number) {
        for (let i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, "materialID", index);
        }
    }

    setVertexOffset(offset: number) {
        for (let i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, "vertexOffset", offset);
        }
    }

    setTransformIndex(index: number) {
        for (let i = 0; i < this.maxInstanceCount; i++) {
            this.instances.set(i, "transformID", index);
        }
    }

    setInstanceBufferIndex(index: number) {
        this.bufferIndex = index;
    }

    toBuffer(): BufferObject {
        return this.instances.data;
    }

    clone(): Component {
        return new InstanceComponent(
            this.instanceCount,
            this.maxInstanceCount,
            this.giDisabled,
            this.raycastDisabled
        );
    }

    /**
     * Instance components require both a mesh source and renderer.
     */
    awake() {
        if (!this.owner.getComponent(MeshFilterComponent)) {
            throw new Error(
                `MeshFilterComponent is missing on ${this.owner.name}`
            );
        }

        if (!this.owner.getComponent(MeshRendererComponent)) {
            throw new Error(
                `MeshRendererComponent is missing on ${this.owner.name}`
            );
        }
    }

    /**
     * Iterates over the allocated instance range.
     * Return false from the callback to stop iteration early.
     */
    forEachInstance(
        fn: (instance: MeshInstance, index: number) => boolean
    ) {
        for (let i = 0; i < this.maxInstanceCount; i++) {
            const instance = this.instances[i];
            const shouldContinue = fn(instance, i);

            if (!shouldContinue) {
                return;
            }
        }
    }

    start() {
    }

    update(time: number, delta: number) {
    }
}
