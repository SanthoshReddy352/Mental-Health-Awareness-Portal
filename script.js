// This script assumes 'marked' is loaded globally from your HTML:
// <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

// IMPORTANT: Replace with your actual API key
const API_KEY = 'AIzaSyCG7KClF3paXEZfOMRoaKV-BVRH3xV_h2A';

// --- Global Variable for Conversation History ---
// Initialize with your system instructions.
// This array will hold alternating user and model messages.
const conversationHistory = [
    {
        role: "user",
        parts: [{ text: "You are a friendly and supportive AI assistant for a mental health awareness portal. Your purpose is to provide general information, resources, and encouragement related to mental well-being. You are NOT a licensed medical professional, therapist, or crisis counselor. You cannot diagnose, treat, or provide medical advice. If a user expresses distress or asks for direct medical help, you must gently redirect them to professional resources or emergency services, and provide a disclaimer. Only discuss topics directly related to mental health awareness, coping strategies, self-care, and understanding common mental health conditions. Decline to answer questions outside this scope or any question seeking medical diagnosis or treatment. Start by saying 'Hello! I am here to provide general information and support related to mental health awareness. How can I help you understand more about mental well-being today?'" }]
    },
    {
        role: "model",
        parts: [{ text: "Hello! I am here to provide general information and support related to mental health awareness. How can I help you understand more about mental well-being today?" }]
    }
];

// Get DOM elements for Gemini Chat
const userInputEl = document.getElementById('gemini-input');
const geminiResponseEl = document.getElementById('gemini-response');
const sendButton = document.querySelector('#gemini-chat-box button'); // Select the button inside the chat section
// Re-added loading and error indicators from previous discussion
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loadingIndicator';
loadingIndicator.classList.add('loading-indicator', 'hidden');
loadingIndicator.innerHTML = '<span></span><span></span><span></span><p>Generating response...</p>';
geminiResponseEl.parentNode.insertBefore(loadingIndicator, geminiResponseEl.nextSibling); // Insert after gemini-response-el

const errorDisplay = document.createElement('div');
errorDisplay.id = 'errorDisplay';
errorDisplay.classList.add('error-display', 'hidden');
errorDisplay.innerHTML = '<p>An error occurred: <span id="errorMessage"></span></p>';
const errorMessageSpan = errorDisplay.querySelector('#errorMessage');
geminiResponseEl.parentNode.insertBefore(errorDisplay, loadingIndicator.nextSibling); // Insert after loadingIndicator


// Helper functions for UI
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    errorDisplay.classList.add('hidden'); // Hide any previous error message
    sendButton.disabled = true; // Disable the button while loading
    userInputEl.disabled = true; // Disable input too
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
    sendButton.disabled = false; // Re-enable the button
    userInputEl.disabled = false; // Re-enable input
    userInputEl.focus(); // Keep focus on the input field
}

// Function to display an error (appends error message to chat area)
function displayError(message) {
    console.error("Displaying error:", message);
    errorMessageSpan.textContent = message || "Unknown error occurred.";
    errorDisplay.classList.remove('hidden'); // Show the dedicated error box
    
    // Create a new div for the error message to append to the chat as a chat bubble
    const errorMessageElement = document.createElement('div');
    errorMessageElement.classList.add('chat-message', 'error-message');
    errorMessageElement.innerHTML = `Error: ${message}`;
    geminiResponseEl.appendChild(errorMessageElement);
    
    // Scroll to make the START of the error message visible
    errorMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
}

// Function to append a message (user or model) to the chat display
// This function will also handle the scrolling for the new message
function appendMessageToChat(role, text) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('chat-message', role + '-message');

    // Convert Markdown to HTML for AI messages, keep user messages as plain text (but in <p>)
    const contentHtml = (role === 'model') ? marked.parse(text) : `<p>${text}</p>`;
    messageContainer.innerHTML = contentHtml;
    geminiResponseEl.appendChild(messageContainer);

    // Scroll to the START of the newly added message element.
    // This makes sure the new message is visible, leaving older content above.
    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
}

// The main function to send prompt to Gemini
async function askGemini() {
    const userInput = userInputEl.value.trim();
    // if (!userInput) {
    //     displayError("Please enter a question.");
    //     return;
    // }

    showLoading(); // Show loading indicator and disable elements

    // --- Add user's new message to history before sending ---
    // Make a copy of conversationHistory to send, so we can add the user's message
    // before showing it, but the main history remains consistent.
    const currentPayloadHistory = [...conversationHistory]; // Create a shallow copy
    currentPayloadHistory.push({ role: "user", parts: [{ text: userInput }] });
    
    appendMessageToChat('user', userInput); // Display user message immediately

    userInputEl.value = ''; // Clear input field after getting prompt and adding to history

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    // --- IMPORTANT: Send the entire conversation history as the payload ---
    const payload = {
        contents: currentPayloadHistory, // Send the history including the new user message
        // Optional: safety settings directly in the fetch call if you prefer
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        // Optional: generation configuration
        // generationConfig: {
        //     maxOutputTokens: 200,
        // },
    };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) { // Check for HTTP errors (4xx or 5xx)
            const errorData = await res.json();
            throw new Error(`API returned status ${res.status}: ${errorData.error.message || JSON.stringify(errorData)}`);
        }

        const data = await res.json();
        console.log("Gemini API Response:", data); // Log the full response for debugging

        if (data && data.candidates && data.candidates.length > 0) {
            const geminiResponseText = data.candidates[0].content.parts[0].text;
            
            // --- Add model's response to history (for next turn) ---
            conversationHistory.push({ role: "model", parts: [{ text: geminiResponseText }] });

            // --- Display formatted response ---
            appendMessageToChat('model', geminiResponseText); 
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
             // Handle cases where the prompt itself was blocked by safety settings
            const blockReason = data.promptFeedback.blockReason;
            displayError(`Your question was blocked by safety filters due to: ${blockReason}. Please rephrase or ask about mental health awareness topics only.`);
            // Do NOT add the blocked prompt or any AI "response" to conversationHistory for future turns.
        } else if (data.error) {
            displayError(`Gemini API error: ${data.error.message}`);
        } else {
            // This case covers empty candidates array but no explicit blockReason
            displayError("Gemini did not return a valid answer or the content was filtered. Please try rephrasing.");
        }
    } catch (err) {
        console.error("Fetch error:", err); // Log full error for debugging
        displayError(`Sorry, I was unable to get a response from Gemini: ${err.message || err}. Check console for details.`);
    } finally {
        hideLoading(); // Hide loading indicator and re-enable elements
    }
}

// --- Event Listeners for Gemini Chat ---
sendButton.addEventListener('click', askGemini);

userInputEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter for new line in textarea
        event.preventDefault(); // Prevent default new line behavior if Enter is pressed alone
        askGemini();
    }
});

// --- Initial Chat Display ---
// Append the initial "model" message from history to the chat box on load
document.addEventListener('DOMContentLoaded', () => {
    // We already put the initial model message in conversationHistory
    // Append it to the display when the DOM is ready.
    // Use the last element of the history which should be the model's greeting.
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'model') {
        // We only append the model's greeting. The user's system instruction is internal.
        appendMessageToChat(
            conversationHistory[conversationHistory.length - 1].role,
            conversationHistory[conversationHistory.length - 1].parts[0].text
        );
    }
});


// ===========================================
// EXISTING QUIZ, STORY, AND CHART JAVASCRIPT
// (Copied directly from your provided script.js content)
// ===========================================

// Quiz Data and Functionality
const animateElements = document.querySelectorAll('.animate');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            // observer.unobserve(entry.target); // animate once if desired, keep observing for re-appear
        } else {
            entry.target.classList.remove('show'); // Remove 'show' if it scrolls out of view
        }
    });
}, { threshold: 0.1 });

animateElements.forEach(el => observer.observe(el));

const quizData = [
    {
        question: "How often do you feel able to relax and unwind after a stressful day?",
        options: [
            { text: "Almost always", category: 'good' },
            { text: "Sometimes", category: 'medium' },
            { text: "Rarely", category: 'average' },
            { text: "Never", category: 'bad' }
        ]
    },
    {
        question: "How would you describe your current sleep habits?",
        options: [
            { text: "Consistently restful", category: 'good' },
            { text: "Fair, but sometimes troubled", category: 'medium' },
            { text: "Inconsistent", category: 'average' },
            { text: "Frequently poor", category: 'bad' }
        ]
    },
    {
        question: "When faced with challenges, you...",
        options: [
            { text: "Feel resilient and seek healthy coping", category: 'good' },
            { text: "Try, but occasionally struggle", category: 'medium' },
            { text: "Find it overwhelming sometimes", category: 'average' },
            { text: "Feel helpless or hopeless", category: 'bad' }
        ]
    },
    {
        question: "How often do you seek help or talk to others when feeling low?",
        options: [
            { text: "Whenever I need to", category: 'good' },
            { text: "Occasionally", category: 'medium' },
            { text: "Rarely", category: 'average' },
            { text: "Never", category: 'bad' }
        ]
    },
    {
        question: "How do you rate your self-esteem currently?",
        options: [
            { text: "High", category: 'good' },
            { text: "Moderate", category: 'medium' },
            { text: "Low at times", category: 'average' },
            { text: "Very low", category: 'bad' }
        ]
    },
    {
        question: "How do you manage feelings of anxiety or worry?",
        options: [
            { text: "Practice calming and grounding techniques", category: 'good' },
            { text: "Try to distract myself", category: 'medium' },
            { text: "Struggle to manage", category: 'average' },
            { text: "Feel overwhelmed often", category: 'bad' }
        ]
    },
    {
        question: "How strong is your social support network?",
        options: [
            { text: "Very strong", category: 'good' },
            { text: "Moderate", category: 'medium' },
            { text: "Weak", category: 'average' },
            { text: "None", category: 'bad' }
        ]
    },
    {
        question: "How often do you enjoy activities or hobbies?",
        options: [
            { text: "Daily or almost daily", category: 'good' },
            { text: "A few times a week", category: 'medium' },
            { text: "Once or twice a month", category: 'average' },
            { text: "Never", category: 'bad' }
        ]
    },
    {
        question: "How frequently do you experience persistent sadness?",
        options: [
            { text: "Very rarely", category: 'good' },
            { text: "Sometimes", category: 'medium' },
            { text: "Often", category: 'average' },
            { text: "Almost all the time", category: 'bad' }
        ]
    },
    {
        question: "How often do you find it difficult to concentrate or focus?",
        options: [
            { text: "Rarely", category: 'good' },
            { text: "Occasionally", category: 'medium' },
            { text: "Frequently", category: 'average' },
            { text: "Always", category: 'bad' }
        ]
    },
    {
        question: "How do you describe your appetite and eating patterns?",
        options: [
            { text: "Healthy and balanced", category: 'good' },
            { text: "Mostly balanced", category: 'medium' },
            { text: "Irregular at times", category: 'average' },
            { text: "Very erratic or unhealthy", category: 'bad' }
        ]
    },
    {
        question: "In the last month, how often did you feel hopeless about your future?",
        options: [
            { text: "Not at all", category: 'good' },
            { text: "A few times", category: 'medium' },
            { text: "Several times", category: 'average' },
            { text: "Very often or always", category: 'bad' }
        ]
    },
    {
        question: "How would you rate your current overall mental health?",
        options: [
            { text: "Excellent", category: 'good' },
            { text: "Good", category: 'medium' },
            { text: "Fair", category: 'average' },
            { text: "Poor", category: 'bad' }
        ]
    }
];

const categoryLabels = {
    good: "Good Mental Health",
    medium: "Medium Mental Health",
    average: "Average Mental Health",
    bad: "Needs Attention"
};

const categoryExplanations = {
    good: "You’re practicing healthy habits and coping strategies.",
    medium: "You're doing well, but could benefit from extra self-care.",
    average: "You face some challenges that would improve with more support or lifestyle changes.",
    bad: "You may be struggling—many people feel this way at times."
};

const categorySuggestions = {
    good: [
        "Continue your positive routines (exercise, adequate sleep, and social activities).",
        "Help others by sharing your strategies.",
        "Stay mindful of any changes in your mood."
    ],
    medium: [
        "Schedule downtime for self-care (relax, meditate, walk in nature).",
        "Strengthen social connections—reach out to friends or loved ones.",
        "Practice stress reduction (breathing exercises, creative hobbies)."
    ],
    average: [
        "Set small, achievable goals to foster a sense of accomplishment.",
        "Seek help from friends, family, or online communities.",
        "Try journaling or mindfulness meditation.",
        "Consider establishing healthy routines (sleep, meals, exercise)."
    ],
    bad: [
        "Reach out to a mental health professional or counselor.",
        "Talk to someone you trust about how you are feeling—don't isolate yourself.",
        "Practice self-compassion and avoid self-criticism.",
        "Remember: seeking help is a sign of strength."
    ]
};

const commonAdvice = [
    "If you feel overwhelmed, it's always okay to speak to a mental health professional.",
    "Engage in hobbies or activities you enjoy.",
    "Prioritize consistent sleep and balanced meals.",
    "Avoid excessive screen time and news overload, especially if it increases stress."
];

const quizSection = document.getElementById('quiz');
const startQuizBtn = document.getElementById('startQuizBtn');
let quizState = { currentQ: 0, answers: Array(quizData.length).fill(null), scores: { good: 0, medium: 0, average: 0, bad: 0 } };

function renderQuiz() {
    quizSection.style.display = 'block';
    document.getElementById('hero').style.display = 'none';
    showQuizCard(quizState.currentQ);
}

function showQuizCard(index) {
    const q = quizData[index];
    let card = `<div class="quiz-card"><h3>Question ${index + 1} of ${quizData.length}</h3>
        <p>${q.question}</p>
        <div class="quiz-options">`;

    q.options.forEach((opt, i) => {
        const selected = quizState.answers[index] === i ? 'selected' : '';
        card += `<button class="${selected}" onclick="selectOption(${index},${i})">${opt.text}</button>`;
    });
    card += `</div>
        <div class="quiz-nav-buttons">
            <button onclick="prevQuestion()" ${index === 0 ? 'disabled' : ''}>Previous</button>`;
    if (index < quizData.length - 1) {
        card += `<button onclick="nextQuestion()" ${quizState.answers[index] === null ? 'disabled' : ''}>Next</button>`;
    } else {
        card += `<button class="quiz-submit" onclick="submitQuiz()" ${quizState.answers[index] === null ? 'disabled' : ''}>Submit</button>`;
    }
    card += `</div></div>`;
    quizSection.innerHTML = card;
}

window.selectOption = function(qIndex, oIndex) {
    quizState.answers[qIndex] = oIndex;
    showQuizCard(qIndex);
};
window.nextQuestion = function() {
    if (quizState.currentQ < quizData.length - 1) {
        quizState.currentQ++;
        showQuizCard(quizState.currentQ);
    }
};
window.prevQuestion = function() {
    if (quizState.currentQ > 0) {
        quizState.currentQ--;
        showQuizCard(quizState.currentQ);
    }
};

window.submitQuiz = function() {
    quizState.scores = { good: 0, medium: 0, average: 0, bad: 0 };
    quizState.answers.forEach((a, i) => {
        const cat = quizData[i].options[a]?.category;
        if (cat) quizState.scores[cat]++;
    });
    let maxCat = Object.keys(quizState.scores).reduce((a, b) => quizState.scores[a] >= quizState.scores[b] ? a : b);

    let summaryHtml = `<div class="summary-card">
        <h3>Your Mental Health Quiz Summary</h3>
        <table id="summary-table">
            <tr>
                <th>Good</th>
                <th>Mediu1m</th>
                <th>Average</th>
                <th>Needs Attention</th>
            </tr>
            <tr class='number-animation'>
                <td>${quizState.scores.good}</td>
                <td>${quizState.scores.medium}</td>
                <td>${quizState.scores.average}</td>
                <td>${quizState.scores.bad}</td>
            </tr>
        </table>
        <div class="summary-status ${maxCat}"><strong>${categoryLabels[maxCat]}</strong></div>
        <p>${categoryExplanations[maxCat]}</p>
        <ul>`;
    categorySuggestions[maxCat].forEach(item => {
        summaryHtml += `<li>${item}</li>`;
    });
    summaryHtml += `</ul><p><b>Remember:</b> Mental health is a <i>journey</i>; reaching out is a sign of strength!</p>`;
    summaryHtml += `<div style="margin-top:10px;border-top:1px solid #e4eaf2;padding-top:7px;">
        <strong>General Tips:</strong><ul>`;
    commonAdvice.forEach(item => {
        summaryHtml += `<li>${item}</li>`;
    });
    summaryHtml += `</ul></div>
        <button onclick="restartQuiz()" class=retake>Retake Quiz</button>
    </div>`;
    quizSection.innerHTML = summaryHtml;
};

window.restartQuiz = function() {
    quizState = { currentQ: 0, answers: Array(quizData.length).fill(null), scores: { good: 0, medium: 0, average: 0, bad: 0 }};
    showQuizCard(0);
};

// Event listener for Start Quiz Button
startQuizBtn.addEventListener('click', renderQuiz);


// Stories: Save and Load
document.getElementById('saveStoryBtn').onclick = function() {
    const story = document.getElementById('yourStory').value;
    const savedMessageEl = document.getElementById('savedMessage');
    if (story.trim().length > 0) {
        localStorage.setItem('yourStory', story);
        savedMessageEl.textContent = 'Your story is saved safely in your browser.';
        savedMessageEl.style.display = 'block';
        savedMessageEl.style.color = ''; // Reset color
        savedMessageEl.style.backgroundColor = '#d4edda'; // Success background
        savedMessageEl.style.borderColor = '#c3e6cb'; // Success border
        setTimeout(() => {
            savedMessageEl.style.display = 'none';
        }, 2500);
    } else {
        savedMessageEl.textContent = 'Please write something before saving.';
        savedMessageEl.style.display = 'block';
        savedMessageEl.style.color = '#856404'; // Warning color
        savedMessageEl.style.backgroundColor = '#fff3cd'; // Warning background
        savedMessageEl.style.borderColor = '#ffeeba'; // Warning border
        setTimeout(() => {
            savedMessageEl.style.display = 'none';
            savedMessageEl.style.color = '';
            savedMessageEl.style.backgroundColor = '';
            savedMessageEl.style.borderColor = '';
        }, 3000);
    }
};

window.onload = function() {
    const saved = localStorage.getItem('yourStory');
    if (saved)
        document.getElementById('yourStory').value = saved;
};

// Graph 1: Diagnoses Per Year from 'csvjson-1.json'
fetch('csvjson (1).json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const yearCounts = {};
        data.forEach(entry => {
            const year = entry["Year Diagnosed"];
            if (year) yearCounts[year] = (yearCounts[year] || 0) + 1;
        });
        const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
        const counts = sortedYears.map(year => yearCounts[year]);

        const ctx = document.getElementById('diagnosisChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Number of Diagnoses',
                    data: counts,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Mental Health Diagnoses Over the Years',
                        font: { size: 18 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Diagnoses' }
                    },
                    x: {
                        title: { display: true, text: 'Year' }
                    }
                }
            }
        });
    })
    .catch(error => { console.error('Error loading diagnoses JSON:', error); });

// Graph 2: Global Mental Disorder Prevalence by Gender from 'data.json'
fetch('data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const maleData = data.filter(entry => entry.sex === "Male");
        const femaleData = data.filter(entry => entry.sex === "Female");

        const years = Array.from(new Set([...maleData, ...femaleData].map(d => d.year))).sort();

        const maleMap = new Map(maleData.map(d => [d.year, d.val * 100]));
        const femaleMap = new Map(femaleData.map(d => [d.year, d.val * 100]));

        const maleVals = years.map(y => maleMap.get(y) !== undefined ? maleMap.get(y).toFixed(2) : null);
        const femaleVals = years.map(y => femaleMap.get(y) !== undefined ? femaleMap.get(y).toFixed(2) : null);

        const ctx = document.getElementById('prevalenceChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Male',
                        data: maleVals,
                        borderColor: 'blue',
                        fill: false,
                        tension: 0.3
                    },
                    {
                        label: 'Female',
                        data: femaleVals,
                        borderColor: 'pink',
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Global Mental Disorder Prevalence by Gender'
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Prevalence (%)' },
                        beginAtZero: false
                    },
                    x: {
                        title: { display: true, text: 'Year' }
                    }
                }
            }
        });
    })
    .catch(error => { console.error('Error loading prevalence JSON:', error); });


// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => { // Encapsulate to avoid re-running if already in onload
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('change', () => {
            if (navToggle.checked) {
                navLinks.classList.add('active');
            } else {
                navLinks.classList.remove('active');
            }
        });

        // Close nav when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.checked = false;
                navLinks.classList.remove('active');
            });
        });
    }

    // Smooth scroll for nav links (if not already handled by CSS scroll-behavior)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
            // Close mobile menu if open
            if (navToggle && navToggle.checked) {
                navToggle.checked = false;
                navLinks.classList.remove('active');
            }
        });
    });

    // Intersection Observer for fade-in animation on scroll (for sections with .animate class)
    // This part was already at the top of your provided script.js, moving it inside DOMContentLoaded
    // for better practice and to avoid duplicate observers if not desired.
    // The animateElements and observer variables are already defined above.
    // The logic to add/remove 'show' class is here.
});