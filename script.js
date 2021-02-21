const video = document.querySelector('.videoContainer');
const body = document.querySelector('body');

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('models') //heavier/accurate version of tiny face detector
]).then(success).catch(fail);

function success() {
    console.log("Models Loaded");
    video.src = 'video/dynamite.mp4';
    console.log(video);
    recognizeFaces();
}

function fail() {
    console.log("Fail to load models");
}

async function recognizeFaces() {
    console.log('recognizeFaces');
    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    video.addEventListener('play', async () => {
        console.log('Start playing')
        const canvas = faceapi.createCanvasFromMedia(video)
        body.append(canvas)

        const displaySize = { width: video.width, height: video.height - 80 }
        faceapi.matchDimensions(canvas, displaySize)

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
            })
        }, 100)
    })
}

function loadLabeledImages() {
    const labels = ['RM', 'Jhope', 'Suga', 'Jin']
    console.log(labels);
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = []
            for (let i = 1; i <= 5; i++) {
                const imgPath = `labeled_images/${label}/${i}.jpg`
                console.log(imgPath)
                const img = await faceapi.fetchImage(imgPath)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            body.append(label + ' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}