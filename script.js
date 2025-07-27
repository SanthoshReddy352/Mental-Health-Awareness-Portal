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
const API_KEY = 'AIzaSyCN1nonb6387eKzJtB4qLhHOL9GJaWrRQg'; // Placeholder - user should replace with their key

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

// New flag to prevent multiple simultaneous submissions
let isSendingMessage = false;

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
    errorMessageElement.classList.add('chat-message', 'error-message-style'); // Use the new class
    errorMessageElement.innerHTML = `Error: ${message}`;
    geminiResponseEl.appendChild(errorMessageElement);
    
    // Scroll to make the START of the error message visible, only if not initial load
    if (!isInitialChatLoad) {
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
    // Prevent multiple calls if a message is already being sent
    if (isSendingMessage) {
        console.log("Message already being sent. Ignoring duplicate call.");
        return;
    }

    const userInput = userInputEl.value.trim();
    // --- DEBUG LOG: Check the value of userInput right before the validation ---
    console.log("User Input before check:", `'${userInput}'`, "Length:", userInput.length); 

    // if (!userInput) { // Re-enabled this check
    //     displayError("Please enter a question.");
    //     return;
    // }

    isSendingMessage = true; // Set flag to true immediately upon valid input
    showLoading(); // Show loading indicator and disable elements

    // Add user's message to the GLOBAL conversationHistory immediately
    conversationHistory.push({ role: "user", parts: [{ text: userInput }] });
    
    appendMessageToChat('user', userInput); // Display user message immediately

    userInputEl.value = ''; // Clear input field after getting prompt and adding to history

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
    
    // Now send the GLOBAL conversationHistory, which includes the latest user input
    const payload = {
        contents: conversationHistory, // Send the updated global history
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
            
            // Add model's response to GLOBAL conversationHistory
            conversationHistory.push({ role: "model", parts: [{ text: geminiResponseText }] });

            // Display formatted response
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
        isSendingMessage = false; // Reset flag in finally block
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

// --- Dark Mode Toggle Functionality ---
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Function to set the theme based on localStorage or system preference
function setThemeFromLocalStorage() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        // Update icon to sun for dark mode
        if (darkModeToggle) {
            darkModeToggle.querySelector('i').classList.remove('fa-moon');
            darkModeToggle.querySelector('i').classList.add('fa-sun');
        }
    } else {
        body.classList.remove('dark-mode');
        // Update icon to moon for light mode
        if (darkModeToggle) {
            darkModeToggle.querySelector('i').classList.remove('fa-sun');
            darkModeToggle.querySelector('i').classList.add('fa-moon');
        }
    }
}

// Event listener for the dark mode toggle button
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeToggle.querySelector('i').classList.remove('fa-moon');
            darkModeToggle.querySelector('i').classList.add('fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            darkModeToggle.querySelector('i').classList.remove('fa-sun');
            darkModeToggle.querySelector('i').classList.add('fa-moon');
        }
    });
}


// --- Chart Modal Functionality ---
const chartModal = document.getElementById('chartModal');
const modalChartTitle = document.getElementById('modalChartTitle');
const maximizedChartCanvas = document.getElementById('maximizedChartCanvas');
const chartCloseButton = document.querySelector('.chart-close-button');

let currentChartInstance = null; // To hold the Chart.js instance in the modal

// Store chart configurations globally
let diagnosisChartConfig = null;
let prevalenceChartConfig = null;

function showChartModal(chartId) {
    let chartConfig;
    let title;

    if (chartId === 'diagnosisChart') {
        chartConfig = diagnosisChartConfig;
        title = "Mental Health Diagnoses Over the Years";
    } else if (chartId === 'prevalenceChart') {
        chartConfig = prevalenceChartConfig;
        title = "Global Mental Disorder Prevalence by Gender";
    }

    if (chartConfig) {
        modalChartTitle.textContent = title;
        
        // Destroy existing chart instance if any
        if (currentChartInstance) {
            currentChartInstance.destroy();
        }

        // Create a new chart instance in the modal canvas
        const ctx = maximizedChartCanvas.getContext('2d');
        currentChartInstance = new Chart(ctx, chartConfig);

        chartModal.classList.remove('hidden');
        document.body.classList.add('no-scroll');
    }
}

function closeChartModal() {
    if (currentChartInstance) {
        currentChartInstance.destroy(); // Destroy the chart instance when closing
        currentChartInstance = null;
    }
    chartModal.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

// Add event listeners to maximize buttons
document.addEventListener('DOMContentLoaded', () => {
    // Set theme on initial load
    setThemeFromLocalStorage();

    document.querySelectorAll('.maximize-chart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const chartId = event.currentTarget.dataset.chartId;
            showChartModal(chartId);
        });
    });

    // Close chart modal event listeners
    chartCloseButton.addEventListener('click', closeChartModal);
    chartModal.addEventListener('click', (e) => {
        if (e.target === chartModal) {
            closeChartModal();
        }
    });

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
            title: "John's Journey: From Child Prodigy to Radio Host",
            image: "https://cdn.prod.website-files.com/6239d220454ddd52a31bc6fb/62c6fd7339515d8f63ed2fa7_John-S.jpg",
            content: "John Shivers, a gifted child who read newspapers at three, faced early bullying and alcoholism by age nine. He left school but earned a GED and built a successful journalism career, now an award-winning radio host at 98.7 WVMO. Despite his achievements, John has struggled with chronic homelessness and mental health issues. Diagnosed with depression and later anxiety, he says his illness often goes unseen, with others focusing only on his addictions.",
            author: "John Shivers"
        },
        {
            title: "Roben's Retirement: Finding Stability After Trauma",
            image: "https://cdn.prod.website-files.com/6239d220454ddd52a31bc6fb/62c6fda15d972a016f0aa384_Roben.jpg",
            content: "Roben R., a 49-year-old Madison resident, spent much of her life battling PTSD, borderline personality disorder, and severe depression, which led to homelessness, addiction, and petty crimes. Despite years of therapy and medication, real change came after a hospitalization following an overdose. With support from Journey Mental Health Center’s Bayside Care Center and Recovery House, Roben found stability, proper treatment, and a renewed sense of purpose. She now feels respected and supported, and enjoys cooking, baking, making jewelry, and watching action movies. Roben says she’s finally “retiring” from her past life.",
            author: "Roben R."
        },
        {
            title: "Mary's Resilience: From Loss to Peer Supporter",
            image: "https://cdn.prod.website-files.com/6239d220454ddd52a31bc6fb/62c6fd8b3fc8c9e9a7b9a78e_Mary.jpg",
            content: "Mary, a 37-year-old woman with a degree in comparative literature, lives with schizoaffective disorder bipolar type. After losing her supportive mother to cancer in her 20s, she became depressed and experienced psychotic symptoms, leading to hospitalization and a long recovery. With therapy and medication, Mary stabilized and became involved with SOAR and Journey Mental Health Center’s Yahara House, where she found community, support, and purpose. She now works as a peer supporter, runs a group for voice-hearers, and is taking classes with hopes of joining the Peace Corps. Mary’s journey shows that recovery is possible, and she believes she can do anything she sets her mind to.",
            author: "Mary"
        },
        {
            title: "Kristen's Advocacy: Defying Stigma with Art and Hope",
            image: "https://cdn.prod.website-files.com/6239d220454ddd52a31bc6fb/62c6fd979e718cd519e61cd5_Kristen.jpg",
            content: "Kristen, 37, has faced a long journey with bipolar II, anxiety, and fibromyalgia since her teens. After a severe mental health crisis, including hallucinations and self-harm, she found crucial support at Journey’s Bayside Care Center. The care and guidance she received helped her stabilize and take steps toward recovery. Now working as a caregiver and preparing to pursue a dual master’s degree in art therapy and counseling, Kristen is determined to use her experiences to help others. She speaks out against the stigma surrounding mental illness, saying, “My diagnosis doesn’t define me. You don’t need to be scared of me.”",
            author: "Kristen"
        }
    ];

    // --- Disorder Data and Rendering ---
    const disordersData = [
        {
            title: "Schizophrenia",
            image: "https://media.gettyimages.com/id/487729535/photo/lost-and-alone.jpg?s=612x612&w=0&k=20&c=CIiCGszVkkcz3-LUhV0gzn7tEbqe_zv7YLsW7P3NV3c=",
            snippet: "A serious mental disorder affecting how a person thinks, feels, and behaves.",
            fullContent: "Schizophrenia is a chronic and severe mental disorder that affects how a person thinks, feels, and behaves. People with schizophrenia may seem like they have lost touch with reality, which can be distressing for them and for their families. Symptoms can include hallucinations (seeing or hearing things that aren't there), delusions (fixed false beliefs), disorganized thinking, and a lack of motivation or expression. While there is no cure, it is treatable with medication, therapy, and support, allowing many individuals to lead fulfilling lives.",
            wikipediaLink: "https://en.wikipedia.org/wiki/Schizophrenia"
        },
        {
            title: "PTSD",
            image: "https://media.gettyimages.com/id/1330747633/photo/depressed-soldier-sitting-on-sofa-with-his-family.jpg?s=612x612&w=0&k=20&c=bz2hONOyTbWLNVZer6B-H1BHWg2WTbZAX_mOoEatcSY=",
            snippet: "A condition triggered by experiencing or witnessing a traumatic event.",
            fullContent: "Post-Traumatic Stress Disorder (PTSD) is a mental health condition that's triggered by a terrifying event — either experiencing it or witnessing it. Symptoms may include flashbacks, nightmares, severe anxiety, and uncontrollable thoughts about the event. Many people who go through traumatic events may have temporary difficulty adjusting and coping, but with time and good self-care habits, they usually get better. If the symptoms get worse, last for months or even years, and interfere with your daily functioning, you may have PTSD. Effective treatments like therapy and medication can help manage symptoms and improve quality of life.",
            wikipediaLink: "https://en.wikipedia.org/wiki/Posttraumatic_stress_disorder"
        },
        {
            title: "Eating Disorders",
            image: "https://media.gettyimages.com/id/157639274/photo/dangerous-behaviour.jpg?s=612x612&w=0&k=20&c=fjzeW0XAjY9J_yUWsaszY7SPh1vnjh9TmQUxCHfMtiY=",
            snippet: "Disorders characterized by abnormal or disturbed eating habits.",
            fullContent: "Eating disorders are serious and often fatal illnesses that are associated with severe disturbances in people’s eating behaviors and related thoughts and emotions. Common eating disorders include anorexia nervosa, bulimia nervosa, and binge-eating disorder. These conditions can significantly impact physical health, emotional well-being, and social functioning. They are not simply about food; they are complex mental health conditions that require professional treatment, often involving a combination of therapy, nutritional counseling, and medical monitoring.",
            wikipediaLink: "https://en.wikipedia.org/wiki/Eating_disorder"
        },
        {
            title: "OCD",
            image: "https://media.gettyimages.com/id/77103424/photo/man-cutting-grass-with-scissors.jpg?s=612x612&w=0&k=20&c=KQuzprmGurKpeQkEaSR9CYRnzo3utCRMQ-_gMB1LB24=",
            snippet: "A disorder where people have recurring, unwanted thoughts and behaviors.",
            fullContent: "Obsessive-Compulsive Disorder (OCD) is a mental health disorder that features a pattern of unwanted thoughts and fears (obsessions) that lead you to do repetitive behaviors (compulsions). These obsessions and compulsions interfere with daily activities and cause significant distress. Obsessions are recurrent and persistent thoughts, urges, or images that are experienced as intrusive and unwanted. Compulsions are repetitive behaviors or mental acts that an individual feels driven to perform in response to an obsession or according to rules that must be applied rigidly. Treatment often involves cognitive-behavioral therapy (CBT), particularly exposure and response prevention (ERP), and sometimes medication.",
            wikipediaLink: "https://en.wikipedia.org/wiki/Obsessive–compulsive_disorder"
        }
    ];


    const storyListContainer = document.querySelector('#stories .story-list');
    const disorderListContainer = document.querySelector('#info .disorder-list'); // New container for disorders
    const storyModal = document.getElementById('storyModal');
    const modalStoryTitle = document.getElementById('modalStoryTitle');
    const modalStoryContent = document.getElementById('modalStoryContent');
    const modalStoryAuthor = document.getElementById('modalStoryAuthor');
    const modalDisorderLinkContainer = document.getElementById('modalDisorderLinkContainer'); // New container for disorder link
    const modalDisorderLink = document.getElementById('modalDisorderLink'); // The actual link
    const closeButton = document.querySelector('.modal-overlay .close-button');

    // Function to truncate text
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    // Render stories
    storyListContainer.innerHTML = ''; // Clear existing stories
    storiesData.forEach(story => {
        const storyCard = document.createElement('div');
        storyCard.classList.add('story-card');
        
        const snippet = truncateText(story.content, 150); // Adjust snippet length as needed

        storyCard.innerHTML = `
            <img src="${story.image}" alt="${story.title}" class="story-card-img">
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
            modalStoryAuthor.style.display = 'block'; // Ensure author is shown for stories
            modalDisorderLinkContainer.style.display = 'none'; // Hide Wikipedia link for stories
            storyModal.classList.remove('hidden');
            document.body.classList.add('no-scroll'); // Prevent background scroll
        });

        storyListContainer.appendChild(storyCard);
    });

    // Render disorders
    disorderListContainer.innerHTML = ''; // Clear existing disorders
    disordersData.forEach(disorder => {
        const disorderCard = document.createElement('div');
        disorderCard.classList.add('disorder-card'); // Keep existing disorder-card class for styling
        
        const snippet = truncateText(disorder.snippet, 100); // Shorter snippet for disorders

        disorderCard.innerHTML = `
            <img src="${disorder.image}" style="border-radius: 5px;" alt="${disorder.title}">
            <h3>${disorder.title}</h3>
            <p class="disorder-snippet">${snippet}</p>
            <button class="read-more-btn">Read More</button>
        `;
        
        // Add event listener to the "Read More" button
        const readMoreBtn = disorderCard.querySelector('.read-more-btn');
        readMoreBtn.addEventListener('click', () => {
            modalStoryTitle.textContent = disorder.title;
            modalStoryContent.textContent = disorder.fullContent; // Full content for disorder
            modalStoryAuthor.style.display = 'none'; // Hide author for disorders
            modalDisorderLink.href = disorder.wikipediaLink;
            modalDisorderLinkContainer.style.display = 'block'; // Show Wikipedia link container
            modalDisorderLink.style.display = 'inline-block'; // Show the link itself
            storyModal.classList.remove('hidden');
            document.body.classList.add('no-scroll'); // Prevent background scroll
        });

        disorderListContainer.appendChild(disorderCard);
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
        // Add base class for transitions
        savedMessageEl.classList.add('saved-message-base');

        saveStoryBtn.onclick = function() {
            const story = yourStoryTextarea.value;
            // Remove previous status classes
            savedMessageEl.classList.remove('saved-message-success', 'saved-message-warning', 'show');
            
            if (story.trim().length > 0) {
                localStorage.setItem('yourStory', story);
                savedMessageEl.textContent = 'Your story is saved safely in your browser.';
                savedMessageEl.classList.add('saved-message-success', 'show'); // Add success class and show
                setTimeout(() => {
                    savedMessageEl.classList.remove('show'); // Hide after delay
                }, 2500);
            } else {
                savedMessageEl.textContent = 'Please write something before saving.';
                savedMessageEl.classList.add('saved-message-warning', 'show'); // Add warning class and show
                setTimeout(() => {
                    savedMessageEl.classList.remove('show'); // Hide after delay
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

            diagnosisChartConfig = { // Store the config
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
                            font: { size: 18, color: 'var(--text-color-primary)' } // Use variable for chart title
                        },
                        legend: {
                            labels: {
                                color: 'var(--text-color-primary)' // Use variable for legend text
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { 
                                display: true, 
                                text: 'Number of Diagnoses', 
                                color: 'var(--text-color-primary)' // Use variable for axis title
                            },
                            ticks: {
                                color: 'var(--text-color-primary)' // Use variable for axis labels
                            },
                            grid: {
                                color: 'var(--card-border)' // Use variable for grid lines
                            }
                        },
                        x: {
                            title: { 
                                display: true, 
                                text: 'Year', 
                                color: 'var(--text-color-primary)' // Use variable for axis title
                            },
                            ticks: {
                                color: 'var(--text-color-primary)' // Use variable for axis labels
                            },
                            grid: {
                                color: 'var(--card-border)' // Use variable for grid lines
                            }
                        }
                    }
                }
            };
            const ctx = document.getElementById('diagnosisChart').getContext('2d');
            new Chart(ctx, diagnosisChartConfig); // Render initial chart
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

            prevalenceChartConfig = { // Store the config
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
                            text: 'Global Mental Disorder Prevalence by Gender',
                            font: { size: 18, color: 'var(--text-color-primary)' } // Use variable for chart title
                        },
                        legend: {
                            labels: {
                                color: 'var(--text-color-primary)' // Use variable for legend text
                            }
                        }
                    },
                    scales: {
                        y: {
                            title: { 
                                display: true, 
                                text: 'Prevalence (%)', 
                                color: 'var(--text-color-primary)' // Use variable for axis title
                            },
                            beginAtZero: false,
                            ticks: {
                                color: 'var(--text-color-primary)' // Use variable for axis labels
                            },
                            grid: {
                                color: 'var(--card-border)' // Use variable for grid lines
                            }
                        },
                        x: {
                            title: { 
                                display: true, 
                                text: 'Year', 
                                color: 'var(--text-color-primary)' // Use variable for axis title
                            },
                            ticks: {
                                color: 'var(--text-color-primary)' // Use variable for axis labels
                            },
                            grid: {
                                color: 'var(--card-border)' // Use variable for grid lines
                            }
                        }
                    }
                }
            };
            const ctx = document.getElementById('prevalenceChart').getContext('2d');
            new Chart(ctx, prevalenceChartConfig); // Render initial chart
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
                // If the link is just '#', scroll to the very top
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
    // This block is now mostly redundant for internal links handled above, but kept for external links or
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
