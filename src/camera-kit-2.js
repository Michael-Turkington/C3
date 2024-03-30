import { bootstrapCameraKit, createMediaStreamSource, Transform2D } from "@snap/camera-kit";

(async function () {
        console.log("Hello");
        console.log("Hello2");
        
    const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzExNjAxNjAyLCJzdWIiOiIyY2ZkMzFiZC1lMWFmLTQ1N2QtYWJmYy1hOThhNzkzMzRlMWZ-U1RBR0lOR34wOTM2YTE4NC00NjJiLTQ5YjgtOGZjYi05YzAwMDNmMmUwNzUifQ.xEpM3aiqXNU6uIM6w70BfsWag42WdXt3wnGv-hckOUk";
    const cameraKit = await bootstrapCameraKit({ apiToken });

    const canvas = document.getElementById("my-canvas");
    const liveRenderTarget = document.getElementById(
         'my-canvas'
          ) as HTMLCanvasElement;
    const session = await cameraKit.createSession({ liveRenderTarget});
    session.events.addEventListener('error', (event) => {
      if (event.detail.error.name === 'LensExecutionError') {
        console.log('The current Lens encountered an error and was removed.', event.detail.error);
      }
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const source = createMediaStreamSource(stream, { transform: Transform2D.MirrorX });
    await session.setSource(source);
    await source.setRenderSize(680, 480);

    const lens = await cameraKit.lensRepository.loadLens("50507980875", "663f5bb4-e694-4260-862f-8979394d866a");
    await session.applyLens(lens);

    await session.play();
    console.log("Lens rendering has started!");
})();
