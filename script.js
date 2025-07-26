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

// This script assumes 'marked' is loaded globally from your HTML:
// <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

// IMPORTANT: Replace with your actual API key
const API_KEY = 'AIzaSyCG7KClF3paXEZfOMRoaKV-BVRH3xV_h2A'; // Placeholder - user should replace with their key

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

// Flag to control initial scroll behavior for chat
let isInitialChatLoad = true;

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
    // Removed: userInputEl.focus(); // This line caused the unwanted scroll back to the input area
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
    
    // Scroll to make the START of the error message visible, only if not initial load
    if (!isInitialChatLoad) {
        // Use smooth scroll to the bottom of the chat container
        geminiResponseEl.scrollTo({ top: geminiResponseEl.scrollHeight, behavior: 'smooth' });
    }
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

    // Scroll to the very bottom of the chat container to show the latest message
    // This ensures the input area remains visible or easily accessible below the chat.
    if (!isInitialChatLoad) {
        geminiResponseEl.scrollTo({ top: geminiResponseEl.scrollHeight, behavior: 'smooth' });
    }
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
        isInitialChatLoad = false; // Set flag to false after the initial message
    }

    // --- Quiz Summary Display Logic ---
    const quizSummaryContainer = document.getElementById('quiz-summary-container');
    const storedScores = sessionStorage.getItem('quizScores');
    const storedMaxCategory = sessionStorage.getItem('quizMaxCategory');

    if (storedScores && storedMaxCategory) {
        const scores = JSON.parse(storedScores);
        const maxCat = storedMaxCategory;

        // Category labels, explanations, and suggestions (copied from quizLogic.js for display)
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

        let summaryHtml = `
            <div class="summary-card">
                <h3>Your Mental Health Quiz Summary</h3>
                <table id="summary-table">
                    <tr>
                        <th>Good</th>
                        <th>Medium</th>
                        <th>Average</th>
                        <th>Needs Attention</th>
                    </tr>
                    <tr class='number-animation'>
                        <td>${scores.good}</td>
                        <td>${scores.medium}</td>
                        <td>${scores.average}</td>
                        <td>${scores.bad}</td>
                    </tr>
                </table>
                <div class="summary-status ${maxCat}"><strong>${categoryLabels[maxCat]}</strong></div>
                <p>${categoryExplanations[maxCat]}</p>
                <ul>`;
            categorySuggestions[maxCat].forEach(item => {
                summaryHtml += `<li>${item}</li>`;
            });
            summaryHtml += `</ul>`;
            summaryHtml += `<p><b>Remember:</b> Mental health is a <i>journey</i>; reaching out is a sign of strength!</p>`;
            
            // New section for General Tips, using the new class
            summaryHtml += `<div class="general-tips-section">
                <strong>General Tips:</strong><ul>`;
            commonAdvice.forEach(item => {
                summaryHtml += `<li>${item}</li>`;
            });
            summaryHtml += `</ul></div>
                <button onclick="window.location.href='index2.html'" class="retake">Retake Quiz</button>
            </div>`;
        
        quizSummaryContainer.innerHTML = summaryHtml;
        quizSummaryContainer.style.display = 'block'; // Ensure the container is visible

        // Clear sessionStorage so summary doesn't reappear on refresh
        sessionStorage.removeItem('quizScores');
        sessionStorage.removeItem('quizMaxCategory');

        // Scroll to the summary section after it's displayed
        quizSummaryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } else {
        quizSummaryContainer.style.display = 'none'; // Hide if no summary data
    }

    // --- Story Data and Rendering ---
    const storiesData = [
        {
            title: "Finding My Voice After Depression",
            content: "For years, I battled with a silent depression that made even simple tasks feel impossible. The world felt muted, and I often found myself withdrawing from friends and family. It took immense courage, but I finally reached out for professional help. Therapy, combined with small, consistent steps like daily walks and journaling, slowly brought color back into my life. I learned to identify triggers, build coping mechanisms, and, most importantly, to be kind to myself. My journey isn't over, but I now have the tools and support system to navigate the ups and downs, and I'm living a life I once thought was out of reach.",
            author: "Sarah M."
        },
        {
            title: "Overcoming Anxiety: A Step-by-Step Triumph",
            content: "My anxiety used to dictate every decision, from what I ate to where I went. Social situations were terrifying, and panic attacks were a regular occurrence. I felt trapped by my own mind. With the guidance of a cognitive-behavioral therapist, I began to challenge my anxious thoughts and gradually expose myself to situations I feared. It was incredibly difficult at first, but each small victory built my confidence. I discovered mindfulness techniques that helped ground me in moments of panic. Today, I can confidently say that I manage my anxiety; it no longer manages me. I've learned that courage isn't the absence of fear, but the triumph over it.",
            author: "David R."
        },
        {
            title: "Embracing My Bipolar Journey",
            content: "Living with bipolar disorder felt like being on an unpredictable rollercoaster. The highs were exhilarating but fleeting, and the lows were crushing. For a long time, I tried to hide my struggles, fearing judgment. The turning point came when I found a psychiatrist who truly listened and a support group where I felt understood. Medication, consistent therapy, and a strong routine became my anchors. I've learned to recognize my mood patterns and communicate my needs to loved ones. My journey is ongoing, but I've found stability, self-acceptance, and a profound appreciation for every moment. My diagnosis doesn't define me; my resilience does.",
            author: "Emily C."
        },
        {
            title: "Healing from Trauma and Finding Peace",
            content: "The echoes of past trauma haunted my days and nights, making it hard to trust, to feel safe, or to simply exist without a sense of dread. I carried a heavy burden, believing I was broken beyond repair. Through trauma-informed therapy, I slowly began to process my experiences in a safe and controlled environment. It was painful work, but with each session, a little more light entered. I learned to regulate my emotions, build healthy boundaries, and reclaim my narrative. Healing is not linear, but I've found a deep sense of peace and a renewed capacity for joy. My past is part of my story, but it no longer controls my future.",
            author: "Alex P."
        }
    ];

    const storyListContainer = document.querySelector('#stories .story-list');
    const storyModal = document.getElementById('storyModal');
    const modalStoryTitle = document.getElementById('modalStoryTitle');
    const modalStoryContent = document.getElementById('modalStoryContent');
    const modalStoryAuthor = document.getElementById('modalStoryAuthor');
    const closeButton = document.querySelector('.modal-overlay .close-button');

    // Function to truncate text
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    // Render stories
    storiesData.forEach(story => {
        const storyCard = document.createElement('div');
        storyCard.classList.add('story-card');
        
        const snippet = truncateText(story.content, 150); // Adjust snippet length as needed

        storyCard.innerHTML = `
            <h3>${story.title}</h3>
            <p class="story-snippet">${snippet}</p>
            <span class="story-author">${story.author}</span>
            <button class="read-more-btn">Read More</button>
        `;
        
        // Add event listener to the "Read More" button
        const readMoreBtn = storyCard.querySelector('.read-more-btn');
        readMoreBtn.addEventListener('click', () => {
            modalStoryTitle.textContent = story.title;
            modalStoryContent.textContent = story.content; // Full content
            modalStoryAuthor.textContent = `- ${story.author}`;
            storyModal.classList.remove('hidden');
            document.body.classList.add('no-scroll'); // Prevent background scroll
        });

        storyListContainer.appendChild(storyCard);
    });

    // Close modal event listeners
    closeButton.addEventListener('click', () => {
        storyModal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
    });

    storyModal.addEventListener('click', (e) => {
        if (e.target === storyModal) { // Close when clicking outside the modal content
            storyModal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
        }
    });

    // Stories: Save and Load
    const yourStoryTextarea = document.getElementById('yourStory');
    const saveStoryBtn = document.getElementById('saveStoryBtn');
    const savedMessageEl = document.getElementById('savedMessage');

    if (saveStoryBtn && yourStoryTextarea && savedMessageEl) {
        saveStoryBtn.onclick = function() {
            const story = yourStoryTextarea.value;
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

        const saved = localStorage.getItem('yourStory');
        if (saved) {
            yourStoryTextarea.value = saved;
        }
    }


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
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                // If the link is just '#', scroll to the top of the window
                if (targetId === '#') {
                    e.preventDefault(); // Prevent default anchor jump
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // For other named anchors, use the existing smooth scroll logic
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault(); // Prevent default anchor jump
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }

                // Close mobile menu if open
                if (navToggle && navToggle.checked) {
                    navToggle.checked = false;
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    // Smooth scroll for nav links (if not already handled by CSS scroll-behavior)
    // This block is now redundant for internal links handled above, but kept for external links or
    // if other parts of the site rely on it. The above block handles internal anchors more specifically.
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Only attach if not already handled by the primary nav-links listener
        // This prevents double event listeners for the same elements.
        if (!anchor.closest('.nav-links')) { 
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') { // Explicitly handle # for non-nav-link anchors if any
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            });
        }
    });
});
