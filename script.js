// Task Manager Web App
// Features: Google Sheets, Google Tasks, Google Calendar, Voice Input

// Initialize Google API
const CLIENT_ID = "1087490879665-5t924msq0eiqrgmrtpcb4t8llq3iddt7.apps.googleusercontent.com";
const API_KEY = "AIzaSyA2Kt3ik4YOKQWGg0zwvja5MWiOw3mvkrg";
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://sheets.googleapis.com/$discovery/rest?version=v4"
];
const SCOPES = "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets";

function handleClientLoad() {
    console.log("handleClientLoad() called.");
    gapi.load("client:auth2", initClient);
}

function initClient() {
    console.log("Initializing Google API Client...");
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        console.log("Google API Initialized Successfully");
    }).catch(error => {
        console.error("Google API Initialization Failed", error);
    });
}

function addTask() {
    let taskTitle = document.getElementById("taskTitle").value;
    let dueDate = document.getElementById("dueDate").value;
    let syncToCalendar = document.getElementById("syncCalendar").checked;
    
    let task = {
        title: taskTitle,
        due: dueDate ? new Date(dueDate).toISOString() : null,
    };
    
    gapi.client.tasks.tasks.insert({
        tasklist: "@default",
        resource: task
    }).then(response => {
        console.log("Task added to Google Tasks", response);
        if (syncToCalendar && dueDate) {
            addTaskToCalendar(taskTitle, dueDate);
        }
    }).catch(error => {
        console.error("Error adding task to Google Tasks", error);
    });
}

function addTaskToCalendar(title, dueDate) {
    let event = {
        summary: title,
        start: { date: dueDate },
        end: { date: dueDate }
    };
    
    gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event
    }).then(response => {
        console.log("Task added to Google Calendar", response);
    }).catch(error => {
        console.error("Error adding task to Google Calendar", error);
    });
}

function startVoiceInput() {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.onresult = (event) => {
        let speechResult = event.results[0][0].transcript;
        document.getElementById("taskTitle").value = speechResult;
    };
    recognition.start();
}

console.log("Script.js loaded successfully.");

