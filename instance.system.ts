import { Actor } from "../actor/actor";
import { InstanceComponent } from "../component/instance.component";
import { BufferUsage, StructArrayBuffer } from "../resources/cpu.buffer";
import { ResourceSystem } from "./resource.system";
import { SystemBase } from "./system.base";

/**
 * Owns global GPU instance allocation.
 *
 * InstanceComponents contain per-actor instance data.
 * InstanceSystem assigns ranges in the shared instance buffer and uploads
 * newly registered components.
 *
 * Other systems consume the buffer through ResourceSystem, avoiding a direct
 * dependency on InstanceSystem.
 */
export class InstanceSystem extends SystemBase {
    /**
     * Instance index 0 is reserved for the root.
     * Allocated component ranges therefore begin at index 1.
     */
    private nextId = 1;

    private instances: StructArrayBuffer<"Instance">;
    private newComponents: InstanceComponent[] = [];
    private instanceToActor = new Map<number, Actor>();

    get currentInstanceCount() {
        return this.nextId;
    }

    initialize(resources: ResourceSystem) {
        this.instances = new StructArrayBuffer({
            label: "Level | InstanceBuffer",
            key: "Instance",
            usage: BufferUsage.STORAGE,
            arrayCount: 100000
        });

        resources.provide("instanceBuffer", this.instances);
    }

    /**
     * Registers an InstanceComponent in the global instance buffer.
     *
     * Each component receives a contiguous range large enough for its
     * maximum instance capacity. Components already owning a range are
     * returned without being registered again.
     */
    register(component: InstanceComponent) {
        if (!component) {
            throw new Error("No InstanceComponent provided.");
        }

        if (component.bufferIndex > 0) {
            return component.bufferIndex;
        }

        const bufferIndex = this.nextId;

        component.setInstanceBufferIndex(bufferIndex);

        this.newComponents.push(component);
        this.instanceToActor.set(bufferIndex, component.owner);

        this.nextId += component.maxInstanceCount;

        return bufferIndex;
    }

    /**
     * Uploads newly registered component data into the shared instance buffer.
     */
    update(time: number, delta: number): void {
        if (this.newComponents.length === 0) {
            return;
        }

        for (const component of this.newComponents) {
            this.instances.setBytes(
                component.instances.data,
                component.bufferIndex * component.instances.uniforms.byteSize
            );
        }
    }

    /**
     * Clears transient registration state after the frame has completed.
     */
    endOfFrame(): void {
        this.newComponents = [];
    }
}
