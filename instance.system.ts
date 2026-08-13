import { Actor } from "../actor/actor";
import { InstanceComponent } from "../component/instance.component";
import { BufferUsage, StructArrayBuffer } from "../resources/cpu.buffer";
import { ResourceSystem } from "./resource.system";
import { SystemBase } from "./system.base";

/**
 * Owns global GPU instance allocation.
 *
 * InstanceComponents contain per-actor instance data.
 * The InstanceSystem assigns buffer ranges and uploads newly
 * registered components to the shared instance buffer.
 *
 * Other systems consume the buffer through ResourceSystem,
 * avoiding direct dependencies on InstanceSystem.
 */
export class InstanceSystem extends SystemBase {
    private nextId = 0;
    private instances: StructArrayBuffer<'Instance'>;
    private newComponents: InstanceComponent[] = [];
    private instToActor: Map<number, Actor> = new Map();

    get currentInstanceCount() { return this.nextId }

    initialize(resources: ResourceSystem) {
        this.instances = new StructArrayBuffer({
            label: 'Level | InstaceBuffer',
            key: 'Instance',
            usage: BufferUsage.STORAGE,
            arrayCount: 100000
        });
        resources.provide('instanceBuffer', this.instances);
    }

    /**
     * Register these instances
     * Updates flag BVH as dirty
     * Flag instances as dirty
     * @param instances
     * @returns
     */
    register(component: InstanceComponent) {
        if (!component) {
            throw new Error(`No instances component attached to meshfilter`)
        }

        if (component.bufferIndex > 0) return component.bufferIndex;

        this.newComponents.push(component);

        component.instanceLocation(this.nextId);

        this.instToActor.set(this.nextId, component.owner);

        this.nextId += component.maxInstanceCount;

        return component.bufferIndex;
    }

    /**
     * TODO: set new instances into this instances buffer
     * @param time
     * @param delta
     */
    update(time: number, delta: number): void {
        if (this.newComponents.length === 0) return;

        for (let i = 0; i < this.newComponents.length; i++) {
            const comp = this.newComponents[i];
            this.instances.setBytes(
                comp.instances.data,
                comp.bufferIndex * comp.instances.uniforms.byteSize
            )
        }
    }

    endOfFrame(): void {
        this.newComponents = [];
    }


}