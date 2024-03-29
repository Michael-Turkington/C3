 <canvas id="my-canvas" width="680" height="480" style="background-color: #FF0200;"></canvas>
    <script>
        const canvas = document.getElementById('my-canvas');
        const context = canvas.getContext('2d');

        async function setupWebcam() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.createElement('video');
                video.srcObject = mediaStream;
                video.play();

                // Draw the video frame to the canvas at intervals
                video.addEventListener('play', function() {
                    function draw() {
                        if (video.paused || video.ended) return;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        requestAnimationFrame(draw);
                    }
                    draw();
                });
            } catch (error) {
                console.error('Error accessing the webcam', error);
            }
        }

        setupWebcam();
    </script>
