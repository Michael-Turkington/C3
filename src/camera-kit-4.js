<script src="https://cdn.jsdelivr.net/npm/@snap/camera-kit@0.16.2/lib/index.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', (event) => {
    async function main() {
        console.log("Hello");
        console.log("Hello2");

        // Assuming CameraKit functions are attached to the window or a global object.
        // This part might need adjustments based on how Camera Kit is actually exposed.
        const { bootstrapCameraKit, createMediaStreamSource, Transform2D } = window.CameraKit || {};

        try {
            const apiToken = "your_api_token_here";
            const cameraKit = await bootstrapCameraKit({ apiToken });

            const canvas = document.getElementById("my-canvas");
            const liveRenderTarget = canvas;
            const session = await cameraKit.createSession({ liveRenderTarget });
            session.events.addEventListener('error', (event) => {
                if (event.detail.error.name === 'LensExecutionError') {
                    console.log('The current Lens encountered an error and was removed.', event.detail.error);
                }
            });

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const source = createMediaStreamSource(stream, { transform: Transform2D.MirrorX });
            await session.setSource(source);
            await source.setRenderSize(680, 480);

            const lensId = "50507980875";
            const groupId = "663f5bb4-e694-4260-862f-8979394d866a";
            const lens = await cameraKit.lensRepository.loadLens(lensId, groupId);
            await session.applyLens(lens);

            await session.play();
            console.log("Lens rendering has started!");
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    main(); // Execute the function when the DOM is fully loaded
});
</script>
