# TypeScript 3D Architecture Sample

This repository contains a small extracted sample of the system/component architecture I use in larger TypeScript 3D applications and rendering projects.

The purpose of this sample is to demonstrate how I structure responsibilities and dependencies rather than provide a complete or runnable engine.

## Architecture

The architecture separates local component state from system-level orchestration.

- **Components** contain state and functionality belonging to an Actor.
- **Systems** manage the global behavior associated with specific component types.
- **Resources** provide shared data, such as GPU buffers, without requiring consumers to depend directly on the system that created them.
- **Actors** provide ownership and hierarchy while remaining relatively lightweight.

Systems are registered once and are responsible only for the components and resources relevant to them.

Per-frame processing is system-driven. Rather than iterating over every component in the world and calling a generic `update()`, systems process the specific components that require work.

For example, a `CameraSystem` can process dynamic `CameraComponent` instances while completely ignoring static cameras and unrelated components.

The generic component `update()` shown in this sample is a legacy part of the base interface and is being phased out in favor of this approach.

## Instance Example

`InstanceComponent` and `InstanceSystem` provide one example of the relationship between components and systems.

`InstanceComponent` owns the data associated with an Actor's GPU instances.

`InstanceSystem` is responsible for global instance allocation and assigns each component a contiguous range in the shared instance buffer. Newly registered instance data is uploaded to that buffer by the system.

The resulting buffer is exposed through `ResourceSystem`, allowing other rendering systems to consume it without depending directly on `InstanceSystem`.

Instance index `0` is reserved for the world root; normal instance allocations therefore begin at index `1`.

## Included Files

- `component.ts` — Base component contract and lifecycle.
- `system.base.ts` — Base contract for registered systems.
- `instance.component.ts` — Example of a specialized graphics component.
- `instance.system.ts` — Example of system-level management of component data.
  
## Resource Lifecycle

The example intentionally does not include the complete resource lifecycle.

GPU resource updates, removal and fragmented buffer management are handled by `ResourceSystem`. When allocations are removed, their ranges can be reclaimed and reused. If fragmentation becomes excessive, resources can be reorganized and affected allocations reassigned.

This keeps resource memory management separate from systems such as `InstanceSystem`, which only need to manage the components and their logical allocations.

## About This Sample

This is a deliberately limited extract intended to demonstrate code structure and architectural approach.

The complete rendering framework contains additional resource management, rendering, scene hierarchy, GPU synchronization, acceleration structures and other systems that are outside the scope of this sample.
