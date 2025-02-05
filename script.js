// Task Manager Web App
// Features: Google Sheets, Google Tasks, Google Calendar, Voice Input

function handleClientLoad() {
    console.log("Loading Google API...");
    gapi.load("client:auth2", () => {
        initClient().then(() => {
            return gapi.client.load("tasks", "v1"); // Ensure Tasks API is fully loaded
        }).then(() => {
            console.log("Google Tasks API Loaded Successfully");
        }).catch(error => {
            console.error("Google API Initialization Failed", error);
        });
    });
}

async function initClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        });
        console.log("Google API Initialized Successfully");
    } catch (error) {
        console.error("Google API Initialization Failed", error);
    }
}

async function ensureTasksApiLoaded() {
    if (!gapi.client.tasks) {
        console.log("Waiting for Google Tasks API to load...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return ensureTasksApiLoaded();
    }
    console.log("Google Tasks API is ready.");
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
    
    gapi.client.tasks.tasks.insert({
        tasklist: "@default",
        resource: task
    }).then(response => {
        console.log("Task added to Google Tasks", response);
        saveTaskToGoogleSheets(taskTitle, dueDate);
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

function saveTaskToGoogleSheets(title, dueDate) {
    let params = {
        spreadsheetId: GOOGLE_SHEET_ID,
        range: "Tasks!A:C",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
    };

    let values = [[title, dueDate, new Date().toISOString()]];

    let body = { values: values };

    gapi.client.sheets.spreadsheets.values.append(params, body).then(response => {
        console.log("Task saved to Google Sheets", response);
    }).catch(error => {
        console.error("Error saving task to Google Sheets", error);
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
