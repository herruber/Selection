import { ServiceRegistry } from "../registry/service.registry";
import { ResourceSystem } from "./resource.system";

export abstract class SystemBase {

    /**
     * Initializes the system before the application starts.
     *
     * Resources provide access to shared engine data such as buffers,
     * textures and other registered resources.
     *
     * The system registry provides access to other systems when required,
     * without forcing direct construction dependencies between them.
     */
    abstract initialize(
        resources: ResourceSystem,
        systems: ServiceRegistry<SystemBase>
    ): void;

    /**
     * Performs per-frame work owned by this system.
     *
     * Systems process only the components and resources relevant to them,
     * rather than iterating over every component in the world.
     */
    abstract update(
        time: number,
        delta: number
    ): void;

    /**
     * Performs end-of-frame cleanup and state transitions.
     *
     * Used for transient collections, dirty flags and other frame-local state
     * that should be reset before the next frame begins.
     */
    abstract endOfFrame(): void;
}
