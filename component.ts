import { Actor } from "../actor/actor";
import { TransformComponent } from "./transform.component";
export type ComponentConstructor<T extends Component> = new (...args: any[]) => T;

export abstract class Component {

    readonly required: boolean = false;

    /**
     * Ownership is assigned when the component is attached to an Actor.
     * A component can belong to only one owner at a time.
     */
    owner: Actor;

    /** Whether this component has completed the awake stage. */
    hasAwoken = false;

    /**
     * Whether this component is active.
     * Inactive components are ignored by rendering and world interaction systems.
     */
    active: boolean = true;

    /**
     * Named transform attachment points exposed by this component.
     * Slots can be used by other components or actors for hierarchical attachment.
     * Examples: LeftWheel, Head, LeftHand.
     */
    slots?: Record<string, TransformComponent>;

    abstract clone(): Component;

    /** Returns the owning Actor's transform. */
    get transform() {
        return this.owner.transform;
    }

    /**
     * Removes this component through its owning Actor.
     * Components exist as part of an Actor and its current world hierarchy,
     * so destruction is handled by the owner to preserve lifecycle integrity.
     */
    destroy() {
        this.owner?.destroyComponent(this);
    }

    /**
     * First lifecycle event.
     * Called when the component is first initialized.
     */
    abstract awake();

    /**
     * Second lifecycle event.
     * Called after newly added components have completed awake().
     *
     * Use this for initialization that depends on other components having
     * completed their own awake stage.
     */
    abstract start();

    /**
     * Legacy generic update hook.
     * The engine is moving toward system-driven updates instead, where only
     * components relevant to a particular system are processed each frame.
     *
     * Example: CameraSystem updates non-static CameraComponents rather than
     * iterating over unrelated components.
     */
    abstract update(time: number, delta: number);

    /**
     * Legacy removal hook.
     * Component removal is now handled by the relevant systems.
     */
    removed(): void { }
}