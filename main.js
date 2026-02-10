// --- New Image Generator Logic ---
const promptInput = document.getElementById('prompt');
const formatPngRadio = document.getElementById('formatPng');
const formatGifRadio = document.getElementById('formatGif');
const generateImageBtn = document.getElementById('generateImageBtn');
const generatedImage = document.getElementById('generatedImage');
const messageArea = document.getElementById('messageArea');

const referenceImageUpload = document.getElementById('referenceImageUpload');
const referenceImagePreview = document.getElementById('referenceImagePreview');
const referenceImagePreviewContainer = document.getElementById('referenceImagePreviewContainer');
const clearReferenceImageBtn = document.getElementById('clearReferenceImage');

const emoticonGallery = document.querySelector('.emoticon-gallery');

const customEmoticonUpload = document.getElementById('customEmoticonUpload');
const customEmoticonPromptInput = document.getElementById('customEmoticonPrompt');
const addCustomEmoticonBtn = document.getElementById('addCustomEmoticonBtn');
const customEmoticonPreview = document.getElementById('customEmoticonPreview');
const customEmoticonPreviewContainer = document.getElementById('customEmoticonPreviewContainer');

let referenceImageBase64 = null; // To store the base64 of the uploaded image
let customEmoticonBase64 = null; // To store the base64 of the custom emoticon image

// Default emoticons
const defaultEmoticons = [
    { src: 'img/chzzk1.png', prompt: 'chzzk character style 1' },
    { src: 'img/chzzk2.png', prompt: 'chzzk character style 2' },
    { src: 'img/chzzk3.png', prompt: 'chzzk character style 3' },
    { src: 'img/eyes/eyes1.png', prompt: 'big round eyes' },
    { src: 'img/eyes/eyes2.png', prompt: 'small sharp eyes' },
    { src: 'img/mouths/mouth1.png', prompt: 'happy smiling mouth' },
    { src: 'img/mouths/mouth2.png', prompt: 'neutral line mouth' }
];

let emoticons = []; // Will hold default + custom emoticons

// --- Persistence Functions ---
function loadEmoticons() {
    const storedEmoticons = localStorage.getItem('customEmoticons');
    if (storedEmoticons) {
        emoticons = [...defaultEmoticons, ...JSON.parse(storedEmoticons)];
    } else {
        emoticons = [...defaultEmoticons];
    }
}

function saveCustomEmoticons() {
    // Filter out default emoticons before saving, only save custom ones
    const customOnly = emoticons.filter(emo => !defaultEmoticons.some(def => def.src === emo.src));
    localStorage.setItem('customEmoticons', JSON.stringify(customOnly));
}

// --- Gallery Rendering ---
function renderEmoticonGallery() {
    emoticonGallery.innerHTML = ''; // Clear existing
    emoticons.forEach((emo, index) => {
        const img = document.createElement('img');
        img.src = emo.src;
        img.alt = emo.prompt;
        img.classList.add('gallery-item');
        img.dataset.prompt = emo.prompt;
        img.dataset.index = index; // Store index for selection management
        emoticonGallery.appendChild(img);
    });
}

// --- Event Listeners ---
generateImageBtn.addEventListener('click', generateImage);
referenceImageUpload.addEventListener('change', handleReferenceImageUpload);
clearReferenceImageBtn.addEventListener('click', clearReferenceImage);
emoticonGallery.addEventListener('click', handleEmoticonGalleryClick);
customEmoticonUpload.addEventListener('change', handleCustomEmoticonUploadPreview);
addCustomEmoticonBtn.addEventListener('click', addCustomEmoticon);

function handleReferenceImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            referenceImageBase64 = e.target.result;
            referenceImagePreview.src = referenceImageBase64;
            referenceImagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        clearReferenceImage();
    }
}

function clearReferenceImage() {
    referenceImageUpload.value = '';
    referenceImageBase64 = null;
    referenceImagePreview.src = '';
    referenceImagePreviewContainer.style.display = 'none';
}

function handleCustomEmoticonUploadPreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            customEmoticonBase64 = e.target.result;
            customEmoticonPreview.src = customEmoticonBase64;
            customEmoticonPreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        customEmoticonBase64 = null;
        customEmoticonPreview.src = '';
        customEmoticonPreviewContainer.style.display = 'none';
    }
}

function addCustomEmoticon() {
    const prompt = customEmoticonPromptInput.value.trim();

    if (!customEmoticonBase64 || !prompt) {
        alert('Please upload an image and provide a description for your custom emoticon.');
        return;
    }

    const newEmoticon = { src: customEmoticonBase64, prompt: prompt };
    emoticons.push(newEmoticon);
    saveCustomEmoticons(); // Save to localStorage
    renderEmoticonGallery();
    
    // Clear inputs
    customEmoticonUpload.value = '';
    customEmoticonPromptInput.value = '';
    customEmoticonBase64 = null;
    customEmoticonPreview.src = '';
    customEmoticonPreviewContainer.style.display = 'none';
}


function handleEmoticonGalleryClick(event) {
    const target = event.target;
    if (target.classList.contains('gallery-item')) {
        target.classList.toggle('selected');
        updatePromptWithEmoticonText();
    }
}

function updatePromptWithEmoticonText() {
    const selectedEmoticons = document.querySelectorAll('.emoticon-gallery .gallery-item.selected');
    let emoticonPrompts = [];
    selectedEmoticons.forEach(item => {
        emoticonPrompts.push(item.getAttribute('data-prompt'));
    });

    let currentPrompt = promptInput.value.trim();
    // Remove previous emoticon style reference if it exists
    let newPromptBase = currentPrompt.split(' --- Style reference:')[0].trim();

    if (emoticonPrompts.length > 0) {
        promptInput.value = newPromptBase + ' --- Style reference: ' + emoticonPrompts.join(', ');
    } else {
        promptInput.value = newPromptBase; // If no emoticons selected, just use the base prompt
    }
}


async function generateImage() {
    const promptText = promptInput.value.trim();
    const format = formatPngRadio.checked ? 'png' : 'gif';

    // Construct contents array for Gemini API (simulated)
    const contents = [];

    if (referenceImageBase64) {
        const [mimeTypePart, dataPart] = referenceImageBase64.split(';base64,');
        const mimeType = mimeTypePart.split(':')[1];
        contents.push({
            inlineData: {
                mimeType: mimeType,
                data: dataPart,
            },
        });
    }

    if (promptText) {
        contents.push({ text: promptText });
    }

    if (contents.length === 0) {
        messageArea.textContent = 'Please enter a prompt or provide a reference image.';
        return;
    }

    messageArea.style.color = 'orange';
    messageArea.textContent = 'Generating image... (This might take a moment)';
    generatedImage.style.display = 'none';
    generatedImage.src = '';
    generateImageBtn.disabled = true;

    try {
        // *** IMPORTANT: In a real application, you should NOT expose your API key directly in client-side code.
        // You would typically use a backend server to proxy requests to the Gemini API securely.
        // For this demonstration, we'll simulate an API call. ***

        // In a real scenario, you would use a library like @google/generative-ai
        // or make a direct fetch to your backend proxy.
        // The `contents` array built above would be sent as part of the request.

        // Simulate API call and image generation
        const response = await new Promise(resolve => setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate for demo
            if (success) {
                const base64Placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADeZzP/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACnSURBVHhe7cEBAQAAAgqC5a1u+gghAAAAAAAAAAAAAN7VzR2JAAAADrR4ySgAAAAAOE+aLgAAAADgfGm6AAAAAOE8abpDAAAAAHCGNN0AAAAAcJ40XQAAAADwnjRdAAAAAPCeNF0AAAAAcJ40XQAAAADwnjRdAAAAAPCeNF0AAAAAcJ40XQAAAADwnjRdAAAAAPCeNF0AAAAA+JkPq/YfG5K3y4UAAAAASUVORK5CYII='; // A small white square 112x112
                resolve({
                    imageData: base64Placeholder,
                    message: 'Image generated successfully!'
                });
            } else {
                resolve({
                    error: 'Failed to generate image. Please try a different prompt.',
                    message: 'Error generating image.'
                });
            }
        }, 3000)); // Simulate 3 seconds API call

        if (response.error) {
            messageArea.style.color = 'red';
            messageArea.textContent = response.error;
        } else {
            generatedImage.src = response.imageData;
            generatedImage.style.display = 'block';
            messageArea.style.color = 'green';
            messageArea.textContent = response.message;
        }

    } catch (error) {
        console.error('Error during image generation:', error);
        messageArea.style.color = 'red';
        messageArea.textContent = 'An unexpected error occurred. Please try again.';
    } finally {
        generateImageBtn.disabled = false;
    }
}

// Initial load
loadEmoticons();
renderEmoticonGallery();