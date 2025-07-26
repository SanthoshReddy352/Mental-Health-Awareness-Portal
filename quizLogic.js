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

let currentQuestionIndex = 0; // Tracks the current question being displayed
let userAnswers = [];         // Stores the selected option object {text, category} for each question
let selectedOption = null;    // Stores the currently selected option object for the current question

// Get a reference to the main quiz container element in index2.html
const quizContainer = document.getElementById('quiz-container');

/**
 * Displays the current question and its options in the quiz container.
 * This function dynamically creates HTML elements and applies CSS classes
 * that are expected to be defined in styles.css.
 */
function displayQuestion() {
    // Clear previous content of the quiz container
    quizContainer.innerHTML = '';

    // Get the current question object from the quizQuestions array
    const questionData = quizQuestions[currentQuestionIndex];

    // Create and append the question heading
    const questionNumberElement = document.createElement('h3'); // Using h3 as per styles.css quiz-card h3
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
    quizContainer.appendChild(questionNumberElement);

    const questionParagraph = document.createElement('p');
    questionParagraph.textContent = questionData.question;
    quizContainer.appendChild(questionParagraph);

    // Create a container for the options and apply the 'quiz-options' class
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-options'; // Class from styles.css

    // Iterate through options and create buttons for each
    questionData.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.textContent = option.text;
        // Add a click event listener to select the option
        optionButton.addEventListener('click', () => selectOption(optionButton, option));

        // If this question was previously answered, pre-select the option
        if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].text === option.text) {
            optionButton.classList.add('selected');
            selectedOption = option; // Ensure selectedOption is set if navigating back
        }
        optionsContainer.appendChild(optionButton);
    });
    quizContainer.appendChild(optionsContainer);

    // Create a container for navigation buttons and apply the 'quiz-nav-buttons' class
    const navigationButtons = document.createElement('div');
    navigationButtons.className = 'quiz-nav-buttons'; // Class from styles.css

    // Create the 'Previous' button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    // Disable the 'Previous' button if it's the first question
    prevButton.disabled = currentQuestionIndex === 0;
    prevButton.addEventListener('click', goToPreviousQuestion);
    navigationButtons.appendChild(prevButton);

    // Create the 'Next' or 'Submit Quiz' button
    const nextButton = document.createElement('button');
    // Change button text based on whether it's the last question
    nextButton.textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Submit Quiz' : 'Next';
    // Initially disable the 'Next' button until an option is selected or if navigating back and no option was selected
    nextButton.disabled = selectedOption === null;
    // Add 'quiz-submit' class if it's the submit button
    if (currentQuestionIndex === quizQuestions.length - 1) {
        nextButton.classList.add('quiz-submit');
    }
    nextButton.addEventListener('click', goToNextQuestion);
    navigationButtons.appendChild(nextButton);

    quizContainer.appendChild(navigationButtons);
}

/**
 * Handles the selection of an answer option.
 * Applies the 'selected' class to the chosen button and updates the selectedOption variable.
 * Enables the 'Next'/'Submit' button.
 * @param {HTMLButtonElement} button - The button element that was clicked.
 * @param {object} optionObject - The selected option object {text, category}.
 */
function selectOption(button, optionObject) {
    // Remove 'selected' class from all other option buttons to ensure only one is selected
    const allOptionButtons = quizContainer.querySelectorAll('.quiz-options button');
    allOptionButtons.forEach(btn => btn.classList.remove('selected'));

    // Add 'selected' class to the clicked button
    button.classList.add('selected');
    selectedOption = optionObject; // Store the full selected option object

    // Enable the 'Next' or 'Submit Quiz' button once an option is selected
    const nextButton = quizContainer.querySelector('.quiz-nav-buttons button:last-child');
    if (nextButton) {
        nextButton.disabled = false;
    }
}

/**
 * Moves to the next question or submits the quiz if it's the last question.
 * Stores the selected answer's category.
 */
function goToNextQuestion() {
    // Check if an option was selected for the current question
    if (selectedOption === null) {
        console.log("Please select an option before proceeding.");
        return; // Stop the function if no option is selected
    }

    // Store the selected option (text and category) for the current question
    userAnswers[currentQuestionIndex] = selectedOption;

    // Move to the next question
    currentQuestionIndex++;
    selectedOption = null; // Reset selected option for the new question

    // If all questions are answered, prepare results and redirect
    if (currentQuestionIndex < quizQuestions.length) {
        displayQuestion();
    } else {
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
