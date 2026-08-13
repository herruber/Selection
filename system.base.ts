import { ServiceRegistry } from "../registry/service.registry";
import { ResourceSystem } from "./resource.system";

export abstract class SystemBase {

    /**
     * Happens once before the App starts
     * @param resources a provided ResourceSystem
     * @param systems the complete ServiceRegistry
     */
    abstract initialize(resources: ResourceSystem, systems: ServiceRegistry<SystemBase>);

    /**
     * Fires every frame.
     * Should handle and update logic about its state, its components and other resources.
     * @param time
     * @param delta
     */
    abstract update(time: number, delta: number): void;

    /**
     * Fires as the last step of every frame.
     * This is ment to clear variables, arrays, set booleans and other simple instructions to make sure the system is ready for another frame.
     */
    abstract endOfFrame(): void;


}