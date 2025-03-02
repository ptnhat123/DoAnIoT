// Cập nhật thời gian realtime
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
    document.getElementById('datetime').textContent = dateTimeString;
    document.getElementById('footer-time').textContent = dateTimeString;
}

// Khởi tạo cập nhật thời gian
setInterval(updateDateTime, 1000);
updateDateTime(); // Gọi ngay lần đầu

// OCR Settings
let ocrSettings = {
    threshold: 128,
    kernelSize: 3,
    minConfidence: 90
};

// Parameter Settings (đồng bộ với Python)
let parameters = {
    contrastEnhancement: 50,
    imageSharpening: 50,
    adaptiveThreshold: 50,
    clahe: 50
};

// Chụp ảnh và chạy OCR
async function capture() {
    document.getElementById('ocr-status').textContent = 'Processing...';
    try {
        const ocrResponse = await fetch('http://192.168.1.14:5000/ocr_from_esp32', {
            method: 'GET',
        });
        const result = await ocrResponse.json();

        if (result.result) {
            document.getElementById('ocr-result').textContent = result.result;
            document.getElementById('last-update').textContent = new Date().toLocaleTimeString('vi-VN');
            document.getElementById('ocr-status').textContent = 'Idle';
        } else {
            document.getElementById('ocr-status').textContent = 'Error';
            document.getElementById('ocr-result').textContent = result.error || 'Unknown error';
        }
    } catch (error) {
        console.error('Error during capture:', error);
        document.getElementById('ocr-status').textContent = 'Error';
        document.getElementById('ocr-result').textContent = 'Failed to connect to server';
    }
}

// Hiển thị giá trị threshold realtime
document.getElementById('thresholdValue').addEventListener('input', function(e) {
    document.getElementById('thresholdDisplay').textContent = e.target.value;
});

// Modal handling
function openOCRSettings() {
    document.getElementById('ocrSettingsModal').classList.remove('hidden');
}

function closeOCRSettings() {
    document.getElementById('ocrSettingsModal').classList.add('hidden');
}

function openParameterSettings() {
    document.getElementById('parameterSettingsModal').classList.remove('hidden');
}

function closeParameterSettings() {
    document.getElementById('parameterSettingsModal').classList.add('hidden');
}

// Lưu cài đặt OCR
async function saveOCRSettings() {
    ocrSettings.threshold = parseInt(document.getElementById('thresholdValue').value) || 128;
    ocrSettings.kernelSize = parseInt(document.getElementById('kernelSize').value) || 3;
    ocrSettings.minConfidence = parseInt(document.getElementById('minConfidence').value) || 90;

    // Đảm bảo kernelSize là số lẻ
    if (ocrSettings.kernelSize % 2 === 0) ocrSettings.kernelSize += 1;

    try {
        const response = await fetch('http://127.0.0.1:5000/configure_ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ocrSettings)
        });

        if (response.ok) {
            alert('Đã lưu cài đặt OCR thành công!');
            console.log('OCR Settings applied:', ocrSettings);
            closeOCRSettings();
        } else {
            alert('Gửi cài đặt thất bại: ' + response.status);
        }
    } catch (error) {
        console.error('Lỗi khi gửi cài đặt:', error);
        alert('Lỗi khi gửi cài đặt: ' + error.message);
    }
}

// Gửi parameters đến Python
async function sendParametersToPython() {
    parameters.contrastEnhancement = parseInt(document.getElementById('contrastEnhancement').value) || 50;
    parameters.imageSharpening = parseInt(document.getElementById('imageSharpening').value) || 50;
    parameters.adaptiveThreshold = parseInt(document.getElementById('adaptiveThreshold').value) || 50;
    parameters.clahe = parseInt(document.getElementById('clahe').value) || 50;

    try {
        const response = await fetch('http://127.0.0.1:5000/adjust_parameters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameters)
        });

        if (response.ok) {
            alert('Đã gửi parameters thành công!');
            console.log('Parameters applied:', parameters);
            closeParameterSettings();
        } else {
            alert('Gửi parameters thất bại: ' + response.status);
        }
    } catch (error) {
        console.error('Error sending parameters:', error);
        alert('Lỗi khi gửi parameters: ' + error.message);
    }
}

function startCapture() {
    const video = document.getElementById('videoElement'); // Thẻ <video>
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    setInterval(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Chuyển đổi ảnh thành Blob
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'capture.png');

            try {
                const response = await fetch('http://127.0.0.1:5000/upload_image', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Kết quả từ server:', result);
                    document.getElementById('resultDisplay').textContent = result.message;
                } else {
                    console.error('Gửi ảnh thất bại');
                }
            } catch (error) {
                console.error('Lỗi khi gửi ảnh:', error);
            }
        }, 'image/png');
    }, 3000); // Gửi ảnh mỗi 3 giây
}


// Event listeners
document.getElementById('openOCRSettingsButton')?.addEventListener('click', openOCRSettings);
document.getElementById('closeOCRSettingsButton')?.addEventListener('click', closeOCRSettings);
document.getElementById('saveOCRSettingsButton')?.addEventListener('click', saveOCRSettings);
document.getElementById('openParameterSettingsButton')?.addEventListener('click', openParameterSettings);
document.getElementById('closeParameterSettingsButton')?.addEventListener('click', closeParameterSettings);
document.getElementById('sendParametersButton')?.addEventListener('click', sendParametersToPython);
document.getElementById('captureButton')?.addEventListener('click', capture); // Thêm nút capture nếu cần
document.getElementById('startCaptureButton').addEventListener('click', startCapture);