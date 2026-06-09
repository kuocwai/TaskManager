let currentFile = "master-task";

const table =
    document.getElementById("taskTable");

const modal =
    document.getElementById("taskModal");


async function loadTasks() {

    const response =
        await fetch(
            `/api/tasks/${currentFile}`
        );

    const data =
        await response.json();

    table.innerHTML = "";

    data.tasks.forEach(task => {

        table.innerHTML += `
        <tr>

            <td>${task.taskName}</td>

            <td>${task.description}</td>

            <td>${task.deadline}</td>

            <td>${task.progress}%</td>

            <td>${task.note || ""}</td>

            <td>${task.status}</td>

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

            if(btn.dataset.file){

                currentFile =
                    btn.dataset.file;

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
async ()=>{

    const response =
        await fetch(
            "/api/sync",
            {
                method:"POST"
            }
        );

    const data =
        await response.json();

    if(data.success){

        alert(
            "Đồng bộ thành công"
        );
    }
    else{

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

async function deleteTask(id){

    const confirmDelete =
        confirm(
            "Xóa task này?"
        );

    if(!confirmDelete){
        return;
    }

    await fetch(
        `/api/tasks/${currentFile}/${id}`,
        {
            method:"DELETE"
        }
    );

    loadTasks();
}

async function editTask(id){

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

    if(!task){
        return;
    }

    const progress =
        prompt(
            "Tiến độ mới (%)",
            task.progress
        );

    if(progress === null){
        return;
    }

    const status =
        prompt(
            "Status (Pending / In Progress / Done)",
            task.status
        );

    await fetch(
        `/api/tasks/${currentFile}/${id}`,
        {
            method:"PUT",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                progress:
                    Number(progress),

                status
            })
        }
    );

    loadTasks();
}