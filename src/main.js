<canvas id="my-canvas" width="680" height="480" style="background-color: #FF0200;"></canvas>
<script>
    const canvas = document.getElementById('my-canvas');
    const context = canvas.getContext('2d');

    async function setupWebcam() {
        try {
            // Request access to the webcam
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = mediaStream;
            video.play();

            // Once the video starts playing, draw its frame to the canvas continuously
            video.addEventListener('play', function() {
                function draw() {
                    if (video.paused || video.ended) return; // Stop drawing if video is paused or ended
                    context.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw the current video frame to the canvas
                    requestAnimationFrame(draw); // Call draw again for the next frame
                }
                draw(); // Start drawing
            });
        } catch (error) {
            console.error('Error accessing the webcam', error); // Log any error to the console
        }
    }

    setupWebcam(); // Initialize the webcam setup
</script>
