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

# CPU Shader Testing Framework & Node System

This framework provides a strongly typed, node-based TypeScript system for authoring, generating, testing and debugging GPU shaders.

Shader logic is constructed using typed TypeScript nodes and compiled into WGSL for normal GPU execution. The same shader definitions can also be executed entirely on the CPU through Node, allowing vertex, fragment, compute and material behavior to be tested using standard Jest test suites.

The goal is not only to validate the final rendered result, but to make shader execution itself observable and testable.

## TypeScript Shader System

Shader structures, bindings, functions and operations are represented through strongly typed TypeScript APIs.
Development of the authoring API is currently paused while work is focused on a WGSL parser and conversion layer capable of converting raw WGSL into the same node representation. 
This will allow existing WGSL shaders to use the CPU testing, execution tracing and debugging framework without requiring them to be rewritten using the TypeScript node API.

The system supports constructs such as:

* Vertex, fragment and compute shaders.
* Typed stage inputs, outputs and varyings.
* Uniform and storage buffers.
* Sampled and storage textures.
* Samplers.
* Shader structures and reusable functions.
* Vector, matrix and scalar operations.
* Bind groups and resource layouts.
* Compute workgroups and invocation built-ins.

The resulting shader graph is compiled into WGSL for execution on the GPU while retaining enough structural information for the same logic to be executed and inspected on the CPU.

## CPU Shader Execution

The CPU simulator executes shader behavior without requiring the GPU to produce the test result.

For rendering tests, vertex shaders are executed against supplied geometry, their outputs are interpolated across generated fragments, and fragment shaders are executed for the resulting pixels.

Compute shaders can similarly be executed using simulated dispatches, workgroups, invocation IDs, buffers, textures and other resources.

This makes shader behavior accessible to normal automated testing infrastructure instead of treating GPU execution as a black box.

## Rendering Assertions

The simulation provides rendering-specific assertions that can be called directly from Jest tests.

For example:

```ts
simulation.toBeMostlyEmpty(0.5);
simulation.toHaveNonZeroNormals("normal");
simulation.toHaveDepth();
```

A failed assertion throws normally and therefore fails the surrounding Jest test.

Assertions can validate properties such as render-target coverage, expected output values, normals, depth and other characteristics of the simulated result.

## Full Execution Tracing

CPU execution makes it possible to inspect considerably more than the final shader output.

The framework tracks operations performed on shader values throughout execution. Values can retain an execution history describing how they were produced and how they changed as shader instructions were evaluated.

For fragment shaders, this information can be associated with individual pixels, allowing a developer to select a problematic pixel and inspect the sequence of operations and intermediate values that produced its final output.

This makes it possible to investigate cases where the final color or value is incorrect without manually working backwards through the shader from the final GPU output.

Execution information can include intermediate calculations, assignments, function calls, reads, writes and other operations affecting tracked values.

The result is effectively a CPU-side execution trace of shader behavior rather than only a snapshot of the final render target.

## Compute Shader Testing

Compute shaders are particularly difficult to debug because their correctness can depend on invocation ordering, shared resources and writes performed by many independent invocations.

The simulator can execute compute workloads on the CPU while tracking the operations performed by individual invocations.

Storage reads and writes can be inspected, including overwrites of values previously written by other invocations. This helps identify conflicting writes and unintended dependencies between compute invocations.

Execution order can also be randomized during testing.

GPU invocations should not incorrectly depend on a predictable execution order where the GPU programming model does not guarantee one. Deterministic CPU execution could otherwise hide these bugs by repeatedly executing invocations in the same sequence.

Randomized invocation order can help expose:

* Order-dependent compute behavior.
* Conflicting storage writes.
* Unintentional overwrites.
* Invalid assumptions about invocation ordering.
* NaN values produced during execution.
* Out-of-bounds indexing.
* Invalid or unexpected intermediate values.
* Other problems that may only appear under particular execution orders.

Because the simulator tracks the operations performed on values, discovering an incorrect result does not only reveal that the test failed — the recorded execution data can also be used to investigate how that result was produced.

## Real-World Test Data

Shader definitions and simulation data do not have to be statically created specifically for a unit test.

The simulator can consume buffers and data produced by external sources, including data loaded from 3D assets.

Vertex data, structured buffers, textures, uniforms and other resources can therefore be populated using real application or asset data and passed into the CPU simulation.

This makes it possible to reproduce rendering problems using the same input data that caused them in an actual scene rather than rebuilding the problem using simplified test fixtures.

For example, geometry and buffer data loaded from a 3D file can be supplied directly to a shader test and executed through the simulated rendering pipeline.

## Result Inspection

Simulation results can be serialized to JSON, including results from compute and material tests.

Results can be inspected directly through the console or loaded into a lightweight local Node-based browser interface for visual inspection.

This provides several levels of debugging:

* Automated Jest assertions for regression testing.
* Console inspection during development.
* Serialized JSON results for deeper analysis.
* Browser-based inspection of rendering results.
* Per-pixel and per-execution tracing of intermediate shader values.
* Compute invocation and storage-write analysis.

## Example

The included example demonstrates:

* Typed vertex inputs, varyings, uniforms and fragment outputs.
* Vertex and fragment shader construction in TypeScript.
* WGSL generation from the same shader definitions.
* Simulated uniforms, textures and samplers.
* Supplying geometry to the simulated vertex stage.
* CPU execution of vertex and fragment shader logic.
* CPU rasterization and interpolation.
* Rendering-specific assertions against the resulting output.

The complete framework additionally supports compute execution, execution tracing, storage-write analysis, randomized invocation ordering and inspection of individual shader values throughout execution.

## Scope

This repository contains a limited usage example intended to demonstrate the public-facing shader API and testing workflow.

The underlying node graph implementation, WGSL generation, CPU shader execution, rasterization, execution tracing and debugging infrastructure are outside the scope of this code sample.
