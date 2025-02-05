// Task Manager Web App
// Features: Google Sheets, Google Tasks, Google Calendar, Voice Input

function handleClientLoad() {
    gapi.load("client:auth2", async () => {
        await initClient();
        await loadGoogleTasksAPI();
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

async function loadGoogleTasksAPI() {
    try {
        await gapi.client.load("tasks", "v1");
        console.log("Google Tasks API Loaded Successfully");
    } catch (error) {
        console.error("Error loading Google Tasks API", error);
    }
}

async function ensureTasksApiLoaded() {
    while (!gapi.client.tasks) {
        console.log("Waiting for Google Tasks API to load...");
        await new Promise(resolve => setTimeout(resolve, 1000));
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
