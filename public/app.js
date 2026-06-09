let currentFile = "master-task";

const table =
    document.getElementById("taskTable");

const modal =
    document.getElementById("taskModal");

const editModal =
    document.getElementById("editModal");

let currentEditId = null;

function getStatusBadge(status) {

    if (status === "Done") {

        return `
        <span class="status done">
            Done
        </span>
        `;
    }

    if (status === "In Progress") {

        return `
        <span class="status progress">
            In Progress
        </span>
        `;
    }

    return `
    <span class="status pending">
        Pending
    </span>
    `;
}

function hideAllSections() {

    document
        .getElementById("taskSection")
        .classList.add("hidden");

    document
        .getElementById("reportSection")
        .classList.add("hidden");

    document
        .getElementById("progressSection")
        .classList.add("hidden");

    document
        .getElementById("logSection")
        .classList.add("hidden");
}

function showTaskSection() {

    hideAllSections();

    document
        .getElementById("taskSection")
        .classList.remove("hidden");
}

function getDeadlineStatus(deadline) {

    const today =
        new Date();

    const due =
        new Date(deadline);

    const diff =

        Math.ceil(

            (due - today)

            /

            (1000 * 60 * 60 * 24)

        );

    if (diff < 0) {

        return `
        <span style="color:red">
            Quá hạn
        </span>
        `;
    }

    if (diff <= 3) {

        return `
        <span style="color:#f57c00">
            Còn ${diff} ngày
        </span>
        `;
    }

    return "";
}

async function loadTasks() {

    const response =
        await fetch(
            `/api/tasks/${currentFile}`
        );

    const data =
        await response.json();

    table.innerHTML = "";
    updateDashboard(
        data.tasks
    );

    data.tasks.forEach(task => {

        table.innerHTML += `
        <tr>

            <td>${task.taskName}</td>

            <td>${task.description}</td>

            <td>

${task.deadline}

<br>

${getDeadlineStatus(
            task.deadline
        )}

</td>

            <td>

    <div class="task-progress">

        <div
            class="task-progress-fill"
            style="width:${task.progress}%">

            ${task.progress}%

        </div>

    </div>

</td>

            <td>${task.note || ""}</td>

            <td>

${getStatusBadge(task.status)}

</td>

            <td>

                <button
                    onclick="editTask(${task.id})">

                    Sửa

                </button>

                <button
                    onclick="deleteTask(${task.id})">

                    Xóa

                </button>

            </td>

        </tr>
        `;
    });
}

function updateDashboard(tasks) {

    document
        .getElementById("totalTasks")
        .innerText =
        tasks.length;

    document
        .getElementById("doneTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status === "Done"
        ).length;

    document
        .getElementById("doingTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status ===
                "In Progress"
        ).length;

    document
        .getElementById("pendingTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status ===
                "Pending"
        ).length;
}

document
    .getElementById("closeEditModal")
    .onclick = () => {

        editModal
            .classList.add(
                "hidden"
            );
    };

document
    .querySelectorAll(".tab")
    .forEach(btn => {

        btn.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".tab")
                    .forEach(t =>
                        t.classList.remove(
                            "active"
                        )
                    );

                btn.classList.add(
                    "active"
                );

                if (btn.dataset.file) {

                    currentFile =
                        btn.dataset.file;

                    showTaskSection();

                    loadTasks();
                }
            }
        );
    });

document
    .getElementById("addTaskBtn")
    .onclick = () => {

        modal.classList.remove(
            "hidden"
        );
    };

document
    .getElementById("closeModal")
    .onclick = () => {

        modal.classList.add(
            "hidden"
        );
    };

document
    .getElementById("syncBtn")
    .onclick =
    async () => {

        const response =
            await fetch(
                "/api/sync",
                {
                    method: "POST"
                }
            );

        const data =
            await response.json();

        if (data.success) {

            alert(
                "Đồng bộ thành công"
            );
        }
        else {

            alert(
                "Lỗi đồng bộ"
            );
        }
    };

document
    .getElementById("saveTask")
    .onclick = async () => {

        const task = {

            taskName:
                document.getElementById(
                    "taskName"
                ).value,

            description:
                document.getElementById(
                    "description"
                ).value,

            deadline:
                document.getElementById(
                    "deadline"
                ).value,

            progress:
                Number(
                    document.getElementById(
                        "progress"
                    ).value
                ),

            note:
                document.getElementById(
                    "note"
                ).value,

            status:
                document.getElementById(
                    "status"
                ).value
        };

        if (
            task.progress < 0 ||
            task.progress > 100
        ) {
            alert(
                "Tiến độ phải từ 0 đến 100%"
            );
            return;
        }

        await fetch(
            `/api/tasks/${currentFile}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(task)
            }
        );

        modal.classList.add(
            "hidden"
        );

        loadTasks();
    };

document
    .getElementById("refreshBtn")
    .onclick = loadTasks;

loadTasks();

async function deleteTask(id) {

    const confirmDelete =
        confirm(
            "Xóa task này?"
        );

    if (!confirmDelete) {
        return;
    }

    await fetch(
        `/api/tasks/${currentFile}/${id}`,
        {
            method: "DELETE"
        }
    );

    loadTasks();
}

async function editTask(id) {

    const response =
        await fetch(
            `/api/tasks/${currentFile}`
        );

    const data =
        await response.json();

    const task =
        data.tasks.find(
            t => t.id === id
        );

    if (!task) {
        return;
    }

    currentEditId = id;

    document
        .getElementById(
            "editTaskName"
        ).value =
        task.taskName;

    document
        .getElementById(
            "editDescription"
        ).value =
        task.description;

    document
        .getElementById(
            "editDeadline"
        ).value =
        task.deadline;

    document
        .getElementById(
            "editProgress"
        ).value =
        task.progress;

    document
        .getElementById(
            "editNote"
        ).value =
        task.note || "";

    document
        .getElementById(
            "editStatus"
        ).value =
        task.status;

    editModal
        .classList.remove(
            "hidden"
        );
}

document
    .getElementById("reportTab")
    .onclick =
    () => {
        setActiveTab("reportTab");
        loadReports();
    };

document
    .getElementById("progressTab")
    .onclick =
    () => {
        setActiveTab("progressTab");
        loadProgress();
    };

document
    .getElementById("logTab")
    .onclick =
    () => {
        setActiveTab("logTab");
        loadLogs();
    };

async function loadReports() {

    hideAllSections();

    document
        .getElementById("reportSection")
        .classList.remove("hidden");

    const response =
        await fetch(
            "/api/reports"
        );

    const data =
        await response.json();

    const reportList =
        document.getElementById(
            "reportList"
        );

    reportList.innerHTML = "";

    (data.reports || [])
        .forEach(report => {

            reportList.innerHTML += `

        <div class="log-item">

            <b>${report.user}</b>

            <br>

            ${report.content}

            <br>

            <small>
                ${report.createdAt}
            </small>

        </div>
        `;
        });
}

document
    .getElementById("submitReport")
    .onclick =
    async () => {

        const user =
            document
                .getElementById(
                    "reportUser"
                )
                .value;

        const content =
            document
                .getElementById(
                    "reportContent"
                )
                .value;

        await fetch(
            "/api/reports",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    user,

                    content
                })
            }
        );

        loadReports();
    };

async function loadProgress() {

    hideAllSections();

    document
        .getElementById("progressSection")
        .classList.remove("hidden");

    const response =
        await fetch(
            "/api/progress"
        );

    const data =
        await response.json();

    const container =
        document.getElementById(
            "progressContainer"
        );

    container.innerHTML = "";

    data.forEach(user => {

        container.innerHTML += `

        <div class="progress-row">

            <div class="progress-label">

                ${user.user}

            </div>

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width:${user.progress}%">

                    ${user.progress}%

                </div>

            </div>

        </div>
        `;
    });
}

async function loadLogs() {

    hideAllSections();

    document
        .getElementById("logSection")
        .classList.remove("hidden");

    const response =
        await fetch(
            "/api/logs"
        );

    const data =
        await response.json();

    const container =
        document.getElementById(
            "activityLog"
        );

    container.innerHTML = "";

    (data.logs || [])
        .forEach(log => {

            container.innerHTML += `

        <div class="log-item">

            <b>${log.user}</b>

            -

            ${log.action}

            -

            ${log.taskName}

            <br>

            <small>
                ${log.time}
            </small>

        </div>
        `;
        });
}

function setActiveTab(tabId) {

    document
        .querySelectorAll(".tab")
        .forEach(tab =>
            tab.classList.remove("active")
        );

    document
        .getElementById(tabId)
        .classList.add("active");
}

setInterval(() => {

    if (
        !document
            .getElementById("taskSection")
            .classList.contains("hidden")
    ) {

        loadTasks();
    }

}, 30000);

document
.getElementById(
    "updateTaskBtn"
)
.onclick =
async ()=>{

    const progress =
        Number(
            document
            .getElementById(
                "editProgress"
            )
            .value
        );

    if(
        progress < 0 ||
        progress > 100
    ){

        alert(
            "Tiến độ phải từ 0 đến 100%"
        );

        return;
    }

    await fetch(

        `/api/tasks/${currentFile}/${currentEditId}`,

        {

            method:"PUT",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                taskName:
                document
                .getElementById(
                    "editTaskName"
                )
                .value,

                description:
                document
                .getElementById(
                    "editDescription"
                )
                .value,

                deadline:
                document
                .getElementById(
                    "editDeadline"
                )
                .value,

                progress,

                note:
                document
                .getElementById(
                    "editNote"
                )
                .value,

                status:
                document
                .getElementById(
                    "editStatus"
                )
                .value
            })
        }
    );

    editModal
    .classList.add(
        "hidden"
    );

    loadTasks();
};