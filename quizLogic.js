/**
 * quizLogic.js
 *
 * This file contains the core logic for the interactive quiz application.
 * It manages questions, user answers (categories), scoring, and, crucially,
 * redirects to index3.html with quiz results stored in sessionStorage.
 */

// Array of quiz questions, copied directly from your script.js.
// Each question is an object with:
// - question: The text of the question.
// - options: An array of possible answers, each with text and a category.
const quizQuestions = [
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
            { text: "Try to cope, but sometimes struggle", category: 'medium' },
            { text: "Often feel overwhelmed", category: 'average' },
            { text: "Tend to avoid or give up", category: 'bad' }
        ]
    },
    {
        question: "How often do you feel overwhelmed by daily tasks or responsibilities?",
        options: [
            { text: "Rarely or never", category: 'good' },
            { text: "Sometimes", category: 'medium' },
            { text: "Often", category: 'average' },
            { text: "Almost always", category: 'bad' }
        ]
    },
    {
        question: "How would you rate your ability to manage stress?",
        options: [
            { text: "Excellent", category: 'good' },
            { text: "Good", category: 'medium' },
            { text: "Fair", category: 'average' },
            { text: "Poor", category: 'bad' }
        ]
    },
    {
        question: "How connected do you feel to friends, family, or your community?",
        options: [
            { text: "Very connected and supported", category: 'good' },
            { text: "Moderately connected", category: 'medium' },
            { text: "Somewhat isolated", category: 'average' },
            { text: "Very isolated and alone", category: 'bad' }
        ]
    },
    {
        question: "How often do you engage in physical activity?",
        options: [
            { text: "Daily or almost daily", category: 'good' },
            { text: "A few times a week", category: 'medium' },
            { text: "Occasionally", category: 'average' },
            { text: "Rarely or never", category: 'bad' }
        ]
    },
    {
        question: "How would you describe your overall mood most days?",
        options: [
            { text: "Positive and optimistic", category: 'good' },
            { text: "Generally stable, with some ups and downs", category: 'medium' },
            { text: "Often low or irritable", category: 'average' },
            { text: "Consistently sad or anxious", category: 'bad' }
        ]
    },
    {
        question: "Do you find yourself withdrawing from social activities you once enjoyed?",
        options: [
            { text: "Never", category: 'good' },
            { text: "Rarely", category: 'medium' },
            { text: "Sometimes", category: 'average' },
            { text: "Often or always", category: 'bad' }
        ]
    },
    {
        question: "How often do you feel a sense of purpose or meaning in your daily life?",
        options: [
            { text: "Almost always", category: 'good' },
            { text: "Often", category: 'medium' },
            { text: "Sometimes", category: 'average' },
            { text: "Rarely or never", category: 'bad' }
        ]
    },
    {
        question: "How well do you manage your emotions during difficult situations?",
        options: [
            { text: "Very well, I stay calm and focused", category: 'good' },
            { text: "Reasonably well, but sometimes I get flustered", category: 'medium' },
            { text: "Not very well, I often feel overwhelmed by them", category: 'average' },
            { text: "Poorly, my emotions often control me", category: 'bad' }
        ]
    },
    {
        question: "How often do you feel hopeful about the future?",
        options: [
            { text: "Almost always", category: 'good' },
            { text: "Most of the time", category: 'medium' },
            { text: "Sometimes", category: 'average' },
            { text: "Rarely or never", category: 'bad' }
        ]
    },
    {
        question: "How often do you engage in activities that bring you joy or help you de-stress?",
        options: [
            { text: "Almost daily", category: 'good' },
            { text: "A few times a week", category: 'medium' },
            { text: "Occasionally", category: 'average' },
            { text: "Rarely or never", category: 'bad' }
        ]
    },
    {
        question: "How confident are you in your ability to handle unexpected life changes?",
        options: [
            { text: "Very confident", category: 'good' },
            { text: "Moderately confident", category: 'medium' },
            { text: "A little unsure", category: 'average' },
            { text: "Not confident at all", category: 'bad' }
        ]
    },
    {
        question: "How often do you practice mindfulness or meditation?",
        options: [
            { text: "Daily", category: 'good' },
            { text: "A few times a week", category: 'medium' },
            { text: "Occasionally", category: 'average' },
            { text: "Never", category: 'bad' }
        ]
    }
];

let currentQuestionIndex = 0; // Tracks the current question being displayed
let userAnswers = [];         // Stores the selected answers for each question
let selectedOption = null;    // Stores the currently selected option for the active question

// Get DOM elements
const quizContainer = document.getElementById('quiz-container');
const quizButtons = document.createElement('div'); // Create a div for buttons
quizButtons.classList.add('quiz-nav-buttons');
quizContainer.parentNode.appendChild(quizButtons); // Append it outside the quiz-card

/**
 * Displays the current question and its options.
 * This function dynamically updates the quiz interface based on `currentQuestionIndex`.
 */
function displayQuestion() {
    // Clear previous content
    quizContainer.innerHTML = '';
    quizButtons.innerHTML = ''; // Clear buttons too

    const questionData = quizQuestions[currentQuestionIndex];

    // Create question number display
    const questionNumberEl = document.createElement('div');
    questionNumberEl.classList.add('question-number');
    questionNumberEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
    quizContainer.appendChild(questionNumberEl);

    // Create question heading
    const questionHeading = document.createElement('h2');
    questionHeading.textContent = questionData.question;
    quizContainer.appendChild(questionHeading);

    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('quiz-options');
    quizContainer.appendChild(optionsContainer);

    // Populate options
    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.dataset.category = option.category; // Store category in dataset
        button.onclick = () => selectOption(option); // Pass the entire option object
        optionsContainer.appendChild(button);

        // If this option was previously selected, mark it
        if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].text === option.text) {
            button.classList.add('selected');
            selectedOption = option; // Ensure selectedOption is set on display
        }
    });

    // Navigation Buttons
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.onclick = goToPreviousQuestion;
    prevButton.disabled = currentQuestionIndex === 0; // Disable if on first question
    quizButtons.appendChild(prevButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Submit Quiz' : 'Next';
    nextButton.onclick = currentQuestionIndex === quizQuestions.length - 1 ? submitQuiz : goToNextQuestion;
    nextButton.disabled = selectedOption === null; // Disable if no option selected
    if (currentQuestionIndex === quizQuestions.length - 1) {
        nextButton.classList.add('quiz-submit'); // Add a class for submit button styling
    }
    quizButtons.appendChild(nextButton);

    // Update the selected option state for the current question
    // This is crucial for enabling/disabling the Next/Submit button correctly
    const currentAnswer = userAnswers[currentQuestionIndex];
    selectedOption = currentAnswer || null;
    nextButton.disabled = selectedOption === null;
}

/**
 * Handles option selection.
 * Marks the selected option and updates the `selectedOption` variable.
 * @param {object} option - The selected option object { text, category }.
 */
function selectOption(option) {
    selectedOption = option; // Update the global selected option
    // Remove 'selected' class from all buttons first
    quizContainer.querySelectorAll('.quiz-options button').forEach(btn => {
        btn.classList.remove('selected');
    });
    // Add 'selected' class to the clicked button
    event.target.classList.add('selected');

    // Enable the next/submit button once an option is selected
    document.querySelector('.quiz-nav-buttons button:last-child').disabled = false;
}

/**
 * Moves to the next question.
 * Stores the current answer and displays the next question.
 */
function goToNextQuestion() {
    if (selectedOption) { // Ensure an option is selected before proceeding
        userAnswers[currentQuestionIndex] = selectedOption; // Store the selected option
        currentQuestionIndex++; // Increment the question index
        selectedOption = null; // Reset selected option for the new question

        if (currentQuestionIndex < quizQuestions.length) {
            displayQuestion(); // Display the next question
        } else {
            // This case should ideally be handled by submitQuiz, but as a fallback
            submitQuiz();
        }
    } else {
        alert('Please select an option before proceeding!'); // Use a custom modal in real app
    }
}

/**
 * Submits the quiz.
 * Calculates scores and redirects to index3.html with results.
 */
function submitQuiz() {
    if (selectedOption) { // Ensure an option is selected for the last question
        userAnswers[currentQuestionIndex] = selectedOption; // Store the last selected option

        // Calculate scores for each category
        const scores = { good: 0, medium: 0, average: 0, bad: 0 };
        userAnswers.forEach(answer => {
            if (answer && answer.category) {
                scores[answer.category]++;
            }
        });

        // Determine the dominant category
        let maxCat = Object.keys(scores).reduce((a, b) => scores[a] >= scores[b] ? a : b);

        // Store results in sessionStorage before redirecting
        sessionStorage.setItem('quizScores', JSON.stringify(scores));
        sessionStorage.setItem('quizMaxCategory', maxCat);

        // Redirect to index3.html
        window.location.href = 'index3.html';
    }
}

/**
 * Moves to the previous question.
 * This function allows users to navigate back and change their answers.
 */
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--; // Decrement the question index
        // Remove the answer for the question we're going back from, if it exists
        userAnswers.pop(); // Simplistic removal for direct previous, careful with jumps
        selectedOption = userAnswers[currentQuestionIndex] || null; // Pre-select if previously answered
        displayQuestion();     // Display the previous question
    }
}

// Initialize the quiz when the DOM content is fully loaded
// This ensures that quizContainer is available before displayQuestion is called.
document.addEventListener('DOMContentLoaded', displayQuestion);
