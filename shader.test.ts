describe("Shader simulation", () => {
    const stageStructs = new Library()
        .add("VertexInput", def.struct.stage(e => ({
            position: e.location(e.vec3())
        })))
        .add("Varyings", def.struct.stage(e => ({
            position: e.builtin("position"),
            worldPosition: e.location(e.vec3()),
            normal: e.location(e.vec3())
        })));

    const structs = new Library()
        .add("Camera", def.struct({
            viewMatrix: declare.mat4x4("f32"),
            projMatrix: declare.mat4x4("f32")
        }))
        .add("Frame", def.struct({
            time: declare.scalar("f32"),
            deltaTime: declare.scalar("f32"),
            camera: declare.struct(/* Camera */)
        }))
        .add("GbufferOutput", def.struct({
            albedo: declare.location(declare.vec4("f32")),
            worldPosition: declare.location(declare.vec3("f32")),
            normal: declare.location(declare.vec4("f32"))
        }));

    const bindgroups = new Library()
        .add("frame", def.bindgroup(e => ({
            frame: e.uniform(
                declare.struct(structs.Frame)
            ),
            albedoTexture: e.texture2d("f32"),
            linearSampler: e.sampler("filtering")
        })));

    test("vertex and fragment shaders can execute on the CPU", () => {
        const shaders = new Library()
            .add("vertex", def.shader({
                stage: "vertex",
                bindgroups: [bindgroups.frame],
                inputs: {
                    input: declare.struct(stageStructs.VertexInput)
                },
                output: declare.struct(stageStructs.Varyings)
            }, ctx => {
                const camera = ctx.frame.value.camera;

                const position = mul(
                    camera.projMatrix,
                    camera.viewMatrix,
                    vec4f(ctx.input.position, 1)
                );

                ctx.output.set({
                    position,
                    worldPosition: ctx.input.position,
                    normal: vec3f(0, 0, 1)
                });
            }))
            .add("fragment", def.shader({
                stage: "fragment",
                bindgroups: [bindgroups.frame],
                inputs: {
                    input: declare.struct(stageStructs.Varyings)
                },
                output: declare.struct(structs.GbufferOutput)
            }, ctx => {
                const albedo = ctx.albedoTexture.sample(
                    vec2f(0, 0),
                    ctx.linearSampler
                );

                ctx.output.set({
                    albedo,
                    worldPosition: ctx.input.worldPosition,
                    normal: vec4f(0, 0, 1, 1)
                });
            }));

        const builder = new WgslBuilder();

        const vertex = builder.buildShader(shaders.vertex);
        const fragment = builder.buildShader(shaders.fragment);

        const simulation = new RenderSimulator({
            vertex: shaders.vertex,
            fragment: shaders.fragment
        }).run(
            vertex.artifact.root,
            fragment.artifact.root,
            {
                // Reduced test setup...
            }
        );

        simulation.toBeBlack("albedo");
        simulation.toJson();
    });
});
