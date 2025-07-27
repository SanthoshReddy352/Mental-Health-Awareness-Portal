Mind Care Portal
A comprehensive web application designed to be a supportive hub for mental well-being. It offers various resources, interactive tools, and information to help users understand, track, and improve their mental health.

Table of Contents
About the Project

Features

Technologies Used

Getting Started

Prerequisites

Installation

Gemini API Key Setup

Usage

File Structure

Contributing

License

Contact

About the Project
The Mind Care Portal aims to provide an accessible and user-friendly platform for mental health awareness. It's built to empower individuals on their journey to well-being by offering:

Self-assessment tools: A quick quiz to check in on mental well-being.

Educational resources: Information on common mental health disorders.

Data insights: Visual statistics and trends related to mental health.

Community and inspiration: A space for sharing personal stories of resilience.

AI-powered support: An intelligent assistant for general information and guidance.

Features
Mental Health Check-in Quiz: An interactive quiz to provide users with a brief overview of their current mental well-being, with results categorized and offering personalized suggestions.

Common Disorders Information: Detailed insights into various mental health disorders, including snippets and links to external resources (e.g., Wikipedia).

Mental Health Statistics: Visual representation of mental health data through interactive charts (e.g., diagnoses over years, global prevalence by gender). Charts can be maximized for better viewing.

Inspirational Stories: A collection of personal stories of resilience and recovery. Users can also write and save their own stories locally in their browser.

AI Chat Assistant: An integrated chatbot powered by the Google Gemini API, offering general information and supportive responses related to mental health awareness.

Responsive Design: Optimized for seamless viewing and interaction across various devices (desktops, tablets, and mobile phones).

Smooth Animations: Subtle scroll-triggered animations for a more engaging user experience.

Technologies Used
HTML5: Structure and content of the web pages.

CSS3: Styling and visual presentation, including responsive design.

JavaScript (ES6+): Core logic, interactivity, and dynamic content loading.

Chart.js: For rendering interactive and responsive data visualizations.

Marked.js: For parsing Markdown content (used in AI chat responses).

Font Awesome: For various icons used throughout the portal.

Google Gemini API: Powers the AI Chat Assistant for intelligent responses.

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
You only need a modern web browser to run this project. For the AI Chat Assistant functionality, you will need a Google Gemini API Key.

Installation
Clone the repository:

git clone https://github.com/your-username/mind-care-portal.git


(Replace your-username with your actual GitHub username if you fork it.)

Navigate to the project directory:

cd mind-care-portal


Open in your browser:
Simply open the index.html file in your preferred web browser.

# Example for opening with a command (might vary by OS)
# open index.html  # On macOS
# start index.html # On Windows
# xdg-open index.html # On Linux


Gemini API Key Setup
The AI Chat Assistant requires a Google Gemini API Key.

Obtain an API Key:

Go to the Google AI Studio and generate a new API key.

Update script.js:

Open the script.js file located in the project root.

Find the line const API_KEY = 'YOUR_API_KEY_HERE';

Replace 'YOUR_API_KEY_HERE' with your actual Gemini API key.

// script.js
const API_KEY = 'YOUR_GENERATED_GEMINI_API_KEY'; // Replace with your actual key


Usage
Home Page (index.html): Explore the main sections of the portal and get a quick overview.

Quiz Page (index2.html): Take the mental health check-in quiz. Your results will be displayed on the main content page.

Main Content Page (index3.html):

Info: Learn about common mental health disorders. Click "Read More" to see full details and a Wikipedia link.

Stats: View interactive charts on mental health diagnoses and prevalence. Click the expand icon to maximize a chart.

Stories: Read inspirational personal stories. You can also write and save your own story using the provided text area.

AI Chat: Interact with the AI assistant for general mental health information and support.

File Structure
mind-care-portal/
├── index.html              # Homepage
├── index2.html             # Mental Health Quiz page
├── index3.html             # Main content page (Info, Stats, Stories, AI Chat)
├── styles.css              # All CSS styles for the entire portal
├── script.js               # Core JavaScript logic (animations, modals, AI chat, data rendering)
├── quizLogic.js            # JavaScript logic specifically for the quiz functionality
├── csvjson (1).json        # Sample data for the Diagnoses chart
├── data.json               # Sample data for the Prevalence chart
└── logo1.png               # Project logo image


Contributing
Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please feel free to:

Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

License
Distributed under the MIT License. See LICENSE for more information.

Contact
Your Name/Team Name - [Your Email/Website/LinkedIn]

Project Link: https://github.com/SanthoshReddy352/Mental-Health-Awareness-Portal/tree/main
