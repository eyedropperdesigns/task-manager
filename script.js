// Task Manager Web App
// Uses Google Identity Services (GIS) for authentication and Google Tasks API

function handleGoogleSignIn(response) {
    console.log("Google Sign-in successful", response);
    initGoogleAPI();
}

async function initGoogleAPI() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS
        });
        console.log("Google API Initialized Successfully");
    } catch (error) {
        console.error("Google API Initialization Failed", error);
    }
}

async function ensureTasksApiLoaded() {
    if (typeof google === "undefined" || !google.accounts.id) {
        console.log("Google Identity Services not loaded, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return ensureTasksApiLoaded();
    }
    console.log("Google Identity Services API is ready.");
}

async function addTask() {
    await ensureTasksApiLoaded();
    
    let taskTitle = document.getElementById("taskTitle").value;
    let dueDate = document.getElementById("dueDate").value;
    let syncToCalendar = document.getElementById("syncCalendar").checked;
    
    let task = {
        title: taskTitle,
        due: dueDate ? new Date(dueDate).toISOString() : null,
    };
    
    try {
        let response = await gapi.client.tasks.tasks.insert({
            tasklist: "@default",
            resource: task
        });
        console.log("Task added to Google Tasks", response);
        saveTaskToGoogleSheets(taskTitle, dueDate);
        if (syncToCalendar && dueDate) {
            addTaskToCalendar(taskTitle, dueDate);
        }
    } catch (error) {
        console.error("Error adding task to Google Tasks", error);
    }
}

async function addTaskToCalendar(title, dueDate) {
    let event = {
        summary: title,
        start: { date: dueDate },
        end: { date: dueDate }
    };
    
    try {
        let response = await gapi.client.calendar.events.insert({
            calendarId: "primary",
            resource: event
        });
        console.log("Task added to Google Calendar", response);
    } catch (error) {
        console.error("Error adding task to Google Calendar", error);
    }
}

async function saveTaskToGoogleSheets(title, dueDate) {
    let params = {
        spreadsheetId: GOOGLE_SHEET_ID,
        range: "Tasks!A:C",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
    };

    let values = [[title, dueDate, new Date().toISOString()]];

    let body = { values: values };

    try {
        let response = await gapi.client.sheets.spreadsheets.values.append(params, body);
        console.log("Task saved to Google Sheets", response);
    } catch (error) {
        console.error("Error saving task to Google Sheets", error);
    }
}

function startVoiceInput() {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.onresult = (event) => {
        let speechResult = event.results[0][0].transcript;
        document.getElementById("taskTitle").value = speechResult;
    };
    recognition.start();
}
