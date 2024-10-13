const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const controlsDiv = document.getElementById('controls');
const predictionsDiv = document.getElementById('predictions');
const progressBarsDiv = document.getElementById('progressBars'); // Progress bars container
const phaseTitle = document.getElementById('phaseTitle');

let dataPoints = [
    { x: 1, y: 1 },
    { x: 3, y: 2 },
    { x: 5, y: 3 },
    { x: 6, y: 3 },
    { x: 7, y: 4 },
    { x: 10, y: 4 },
    { x: 11, y: 5 },
    { x: 13, y: 7 },
    { x: 15, y: 7 },
    { x: 18, y: 8 },
    { x: 21, y: 8 },
    { x: 25, y: 9 },
];

let w = 0;
let b = 0;
const learningRate = 0.001;
let iteration = 0;
const mseThreshold = 1.0;
let progressBars = []; // Array to hold progress bars

document.getElementById('collectDataBtn').addEventListener('click', handleCollectData);

// Load face image
const faceImg = new Image();
faceImg.src = 'face.png';

function drawAxes() {
    const width = canvas.width;
    const height = canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.stroke();

    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50, 50);
    ctx.stroke();

    // Draw grid lines and labels
    ctx.strokeStyle = 'lightgray';
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
        const y = height - 50 - i * 50;
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(width - 50, y);
        ctx.stroke();
        if (i % 1 === 0) {
            ctx.fillText(i, 30, y + 5);
        }
    }

    // Vertical grid lines
    for (let i = 0; i <= 25; i += 5) {
        const x = 50 + i * 28;
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, height - 50);
        ctx.stroke();
        ctx.fillText(i, x - 5, height - 30);
    }

    // Draw x-axis label
    ctx.fillText('Wöchentliche Lernstunden', width / 2 - 30, height - 10);

    // Draw y-axis label
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Anzahl der richtigen Antworten (1-10)', -50, 0);
    ctx.restore();
}

function drawDataPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    drawAxes(); // Redraw axes

    dataPoints.forEach(point => {
        const x = 50 + point.x * 28;
        const y = canvas.height - 50 - point.y * 50;
        ctx.drawImage(faceImg, x - 10, y - 10, 20, 20); // Draw face image
    });
}

function handleCollectData() {
    phaseTitle.innerText = 'Trainingsphase'; // Change title to "Training Phase"
    drawDataPoints();
    iteration = 0; // Reset iteration count
    controlsDiv.innerHTML = `
        <p>
            Jetzt haben wir also die Daten. Sehen wir uns an, wie der lineare Regressionsalgorithmus durch Beobachtung gekennzeichneter Daten ein Modell lernt.
        </p>
        <br>
        <button id="startLearningBtn">
            Schauen wir mal!
        </button>
    `;
    document.getElementById('startLearningBtn').addEventListener('click', showExplanation);
}

function showExplanation() {
    controlsDiv.innerHTML = `
        <p>
            Lassen Sie uns zunächst diesen Algorithmus ein wenig besser verstehen.
        <br>
            Das durch die lineare Regression erstellte Modell wird durch eine gerade Linie dargestellt (im Gegensatz zum Entscheidungsbaumalgorithmus, bei dem das Modell durch einen Baum dargestellt wird).
        <br>
            Mathematisch gesehen ist eine gerade Linie wie folgt definiert, wobei wir durch Ändern des Werts der Gewichte meines Modells (d. h. a und b) verschiedene Linien erhalten können:
        </p>
        <h4> y = a * x + b </h4> 

            Versuchen Sie, die folgenden Gewichte zu ändern, und überprüfen Sie, wie wir durch Ändern der Gewichte verschiedene Linien erhalten können:

        <div>
            <label for="aRange">a (Slope): </label>
            <input type="range" id="aRange" min="-5" max="5" step="0.1" value="0">
            <span id="aValue">0</span>
        </div>
        <div>
            <label for="bRange">b (Intercept): </label>
            <input type="range" id="bRange" min="-10" max="10" step="0.1" value="0">
            <span id="bValue">0</span>
        </div>
        <br>
        <p>
            Die Aufgabe des linearen Regressionsalgorithmus besteht darin, die geeigneten Werte für die Gewichte a und b zu ermitteln, d. h. die Linie zu finden, die am besten zu den Daten „passt“.
        </p>
        <button id="startLearningProcessBtn">
            Beginnen wir mit dem Lernprozess
        </button>

    `;
    document.getElementById('startLearningProcessBtn').addEventListener('click', startLearningProcess);
    document.getElementById('aRange').addEventListener('input', updateLineFromInputs);
    document.getElementById('bRange').addEventListener('input', updateLineFromInputs);
}

function updateLineFromInputs() {
    const a = parseFloat(document.getElementById('aRange').value);
    const b = parseFloat(document.getElementById('bRange').value);
    document.getElementById('aValue').textContent = a;
    document.getElementById('bValue').textContent = b;
    drawDataPoints();
    drawLine(a, b);
}

function startLearningProcess() {
    w = 0; // Set w to 0
    b = 0; // Set b to 0
    drawDataPoints();
    drawLine(w, b);
    addProgressBar(); // Add the first progress bar
    nextIteration();
}

function addProgressBar() {
    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('progress-bar');
    progressBarsDiv.appendChild(progressBarContainer);

    const progressBar = new ProgressBar.Circle(progressBarContainer, {
        strokeWidth: 6,
        color: '#f0c27b', // Yellow color for the progress bar
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: null,
    });
    
    const label = document.createElement('span');
    label.innerText = `Iteration ${iteration}`;
    progressBarContainer.appendChild(label);

    progressBars.push(progressBar);
}

function updateProgressBar(step) {
    const progressBar = progressBars[progressBars.length - 1];
    if (step === 2) {
        progressBar.animate(1.0);
    } else {
        progressBar.animate(0.5 * step);
    }
}

function nextIteration() {
    predictionsDiv.innerHTML = ''; // Clear the previous messages
    let html = `<h2>Iteration ${iteration}</h2>`;
    if (iteration === 0) {
        html += `
            <p>
                Der lineare Regressionsalgorithmus weiß nicht, wie die geeigneten Gewichtswerte aussehen, daher lernt er Iteration für Iteration.
            </p>
            <p>
                Normalerweise beginnt der Algorithmus mit a = 0 und b = 0.
            </p>
            <p>
                Mathematisch haben wir die folgende Gleichung:
            </p>
            <h4>y = ${w} * x + ${b}</h4>
            <p>
                Grafisch haben wir die folgende gelbe Linie:
            </p>
        `;
    }
    html += `<button id="nextBtn">Weiter</button>`;
    controlsDiv.innerHTML = html;
    document.getElementById('nextBtn').addEventListener('click', () => checkModel());
}

function drawLine(a, b) {
    const startX = 0; // start from x = 0
    const endX = 25; // end at x = 25
    let startY = a * startX + b;
    let endY = a * endX + b;

    // Convert graph coordinates to canvas coordinates
    const startXCanvas = 50 + startX * 28;
    const endXCanvas = 50 + endX * 28;
    const startYCanvas = canvas.height - 50 - startY * 50;
    const endYCanvas = canvas.height - 50 - endY * 50;

    ctx.strokeStyle = '#f0c27b'; // Yellow color for the line
    ctx.lineWidth = 4; // Thicker line for the model
    ctx.beginPath();
    ctx.moveTo(startXCanvas, startYCanvas);
    ctx.lineTo(endXCanvas, endYCanvas);
    ctx.stroke();
}

function calculateMSE(w, b) {
    let mse = 0;
    dataPoints.forEach(point => {
        const predictedY = w * point.x + b;
        mse += (point.y - predictedY) ** 2;
    });
    mse /= dataPoints.length;
    return mse;
}

function checkModel() {
    const mse = calculateMSE(w, b);

    if (mse < mseThreshold) {
        controlsDiv.innerHTML = `<p>
            Great! We have a model with low error and that fits our data!</p>
            <button id="useModelBtn">
                Use your model
            </button>`;
        predictionsDiv.innerHTML = '';
        document.getElementById('useModelBtn').addEventListener('click', showTestPhase);
        updateProgressBar(2); // Fully fill the progress bar
    } else {
        controlsDiv.innerHTML = '<p></p>';
        calculateErrors();
        updateProgressBar(1); // Update the progress bar to 1/3
    }
}

function calculateErrors() {
    const mse = calculateMSE(w, b);
    let evaluationMessage = '';

    if (iteration === 0) {
        evaluationMessage = `
            <h2>
                I - BEWERTUNG: Fehler berechnen (Iteration ${iteration})
            </h2>
            <p>
                Der lineare Regressionsalgorithmus berechnet den Fehler, d. h., er vergleicht die vom Modell vorhergesagten Werte mit den tatsächlichen Werten, um zu beurteilen, ob das Modell gut zu den Daten passt.
            </p>
            <p>
                Das Ziel ist es, einen Fehler nahe 0 zu haben, und da der Fehler hoch ist, sollten wir die Gewichte aktualisieren.
            </p>
            <p>
                Eine beliebte Methode zur Berechnung dieses Fehlers ist die Verwendung des mittleren quadratischen Fehlers, der nun  ${mse.toFixed(2)} beträgt.
            </p>
            <button id="updateParametersBtn">Aktualisiere Gewichtswerte</button>
        `;
    } else {
        evaluationMessage = `
            <h2>
                I - BEWERTUNG: Fehler berechnen (Iteration ${iteration})
            </h2>
            <p> 
                Berechnen wir nun den Fehler mit den aktualisierten Gewichtungswerten, d. h. vergleichen wir die vom Modell vorhergesagten Werte mit den tatsächlichen Werten, um zu beurteilen, ob das Modell gut zu den Daten passt.            </p>
            <p>
                Der mittlere quadratische Fehler beträgt jetzt ${mse.toFixed(2)}. Da das Ziel darin besteht, einen Fehler nahe 0 zu haben, und der Fehler hoch ist, sollten wir die Gewichtswerte aktualisieren.
            </p>
            <button id="updateParametersBtn">Aktualisiere Gewichtswerte</button>
        `;
    }

    predictionsDiv.innerHTML = evaluationMessage;

    // Attach the event listener to the button after it's been rendered
    document.getElementById('updateParametersBtn').addEventListener('click', updateParameters);
    updateProgressBar(1); // Update the progress bar to 2/3

    // Draw lines connecting each data point to the regression line
    dataPoints.forEach(point => {
        const xCanvas = 50 + point.x * 28;
        const yCanvas = canvas.height - 50 - point.y * 50;
        const predictedY = w * point.x + b;
        const predictedYCanvas = canvas.height - 50 - predictedY * 50;

        ctx.strokeStyle = '#84804d'; // Custom color for the connecting lines
        ctx.lineWidth = 2; // Thicker line
        ctx.beginPath();
        ctx.moveTo(xCanvas, yCanvas);
        ctx.lineTo(xCanvas, predictedYCanvas);
        ctx.stroke();
    });
}


function updateParameters() {
    // Implementing one iteration of gradient descent
    let wGradient = 0;
    let bGradient = 0;
    const n = dataPoints.length;

    dataPoints.forEach(point => {
        const predictedY = w * point.x + b;
        wGradient += -(2/n) * point.x * (point.y - predictedY);
        bGradient += -(2/n) * (point.y - predictedY);
    });

    w -= learningRate * wGradient;
    b -= learningRate * bGradient;

    // Increment iteration count
    iteration += 1; 

    // Update the line on the canvas
    drawDataPoints();
    drawLine(w, b);

    let improvementMessage = '';

    if (calculateMSE(w, b) >= mseThreshold) {
        if (iteration === 1) {
        improvementMessage = `
            <h2>
                II - VERBESSERUNG: Aktualisieren der Gewichtungen (Iteration ${iteration - 1})
            </h2>
            <p>
                Wie wir überprüft haben, ist das aktuelle Modell mit den vorherigen Gewichtungen nicht geeignet. Versuchen wir es mit anderen Gewichtungswerten:
            </p>
            <p>a = ${w.toFixed(2)}</p>
            <p>b = ${b.toFixed(2)}</p>
            <p>
                <i> Um die Gewichtungswerte automatisch zu aktualisieren, verwendet die lineare Regression den Gradientenabstiegsalgorithmus.</i>
            </p>
            <p>
                Sehen wir uns an, wie unser Modell mit den neuen Gewichtungswerten aussieht. Überprüfen Sie die Grafik:
            </p>
            <button id="evaluateBtn">Modell auswerten</button>
        `;
        predictionsDiv.innerHTML = improvementMessage;
        // Attach event listener for the 'Evaluate' button
        document.getElementById('evaluateBtn').addEventListener('click', () => {
            addProgressBar(); // Add a new progress bar for the next iteration
            calculateErrors();
        });
        updateProgressBar(2); // Fully fill the progress bar for the current iteration
        } else {
            improvementMessage = `
                <h2>
                    II - VERBESSERUNG: Aktualisieren der Gewichtungen (Iteration ${iteration - 1})
                </h2>
                <p>
                    Wie wir überprüft haben, ist das aktuelle Modell mit den vorherigen Gewichtungen nicht geeignet. Versuchen wir es mit anderen Gewichtungswerten:
                </p>
                <p>a = ${w.toFixed(2)}</p>
                <p>b = ${b.toFixed(2)}</p>
                <p>
                    Sehen wir uns an, wie unser Modell mit den neuen Gewichtungswerten aussieht. Überprüfen Sie die Grafik:
                </p>
                <button id="evaluateBtn">Modell auswerten</button>
            `;
            predictionsDiv.innerHTML = improvementMessage;
        // Attach event listener for the 'Evaluate' button
        document.getElementById('evaluateBtn').addEventListener('click', () => {
            addProgressBar(); // Add a new progress bar for the next iteration
            calculateErrors();
        });
        updateProgressBar(2); // Fully fill the progress bar for the current iteration
        } 
    } else {
        controlsDiv.innerHTML = `<p>Großartig! Wir haben ein Modell mit geringer Fehlerquote, das zu unseren Daten passt!</p>
            <button id="useModelBtn">Verwenden Sie Ihr Modell</button>`;
        predictionsDiv.innerHTML = '';
        document.getElementById('useModelBtn').addEventListener('click', showTestPhase);
        updateProgressBar(2); // Fully fill the progress bar for the current iteration
    }
}


function showTestPhase() {
    // Remove progress bars and data points
    progressBarsDiv.innerHTML = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawLine(w, b); // Redraw the learned line

    // Update phase title and controls
    phaseTitle.innerText = 'Anwendungsphase';
    controlsDiv.innerHTML = `
        <p>
            Verwenden Sie dieses Modell, um vorherzusagen, wie viele richtige Antworten Sie im Test erhalten werden, je nachdem, wie viele Stunden Sie wöchentlich lernen möchten. Geben Sie die Anzahl der Stunden ein, die Sie lernen möchten:
        </p>
        <input type="number" id="studyHours" min="0" max="25" step="0.1">
        <button id="submitHoursBtn">Senden</button>
        <div id="predictionResult"></div>
    `;
    document.getElementById('submitHoursBtn').addEventListener('click', predictCorrectAnswers);
}

function predictCorrectAnswers() {
    const studyHoursInput = document.getElementById('studyHours');
    const studyHours = parseFloat(studyHoursInput.value);

    if (isNaN(studyHours) || studyHours < 0 || studyHours > 25) {
        alert('Bitte geben Sie eine gültige Anzahl von Stunden zwischen 0 und 25 ein.');
        return;
    }

    const predictedAnswers = w * studyHours + b;
    const resultDiv = document.getElementById('predictionResult');
    resultDiv.innerHTML = `<p>Wenn Sie ${studyHours} Stunden pro Woche lernen, können Sie davon ausgehen, dass Sie etwa ${predictedAnswers.toFixed(2)} von 10 Fragen richtig beantworten.</p>`;
    addTestDataPoint(studyHours, predictedAnswers);
}

function addTestDataPoint(x, y) {
    const xCoord = 50 + x * 28;
    const yCoord = canvas.height - 50 - y * 50;
    ctx.drawImage(faceImg, xCoord - 10, yCoord - 10, 20, 20); // Draw face image
}

// Initial draw when the page loads
drawAxes();
